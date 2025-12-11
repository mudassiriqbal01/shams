import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { Department } from '../database/entities/department.entity';
import { UserDepartmentMembership } from '../database/entities/user-department-membership.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SwitchDepartmentDto } from './dto/switch-department.dto';
import { AuthResponse, JwtPayload, RefreshTokenPayload, UserDto } from '@shams-vision/shared';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(UserDepartmentMembership)
    private membershipRepository: Repository<UserDepartmentMembership>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, firstName, lastName, password, departmentId } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      passwordHash,
      activeDepartmentId: departmentId,
    });

    const savedUser = await this.userRepository.save(user);

    // Create membership
    await this.membershipRepository.save({
      userId: savedUser.id,
      departmentId,
    });

    return this.generateAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['memberships'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure active department is valid
    const activeDeptMembership = user.memberships.find(
      (m) => m.departmentId === user.activeDepartmentId,
    );

    if (!activeDeptMembership) {
      // Fallback to first membership
      if (user.memberships.length > 0) {
        user.activeDepartmentId = user.memberships[0].departmentId;
        await this.userRepository.save(user);
      } else {
        throw new UnauthorizedException('User has no department memberships');
      }
    }

    return this.generateAuthResponse(user);
  }

  async refreshToken(refreshToken: string, userId: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      if (payload.userId !== userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['memberships'],
      });

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Token version mismatch');
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async switchDepartment(
    userId: string,
    switchDto: SwitchDepartmentDto,
  ): Promise<AuthResponse> {
    const { departmentId } = switchDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['memberships'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hasMembership = user.memberships.some((m) => m.departmentId === departmentId);
    if (!hasMembership) {
      throw new BadRequestException('User does not have access to this department');
    }

    user.activeDepartmentId = departmentId;
    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  private async generateAuthResponse(user: User): Promise<AuthResponse> {
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      activeDepartmentId: user.activeDepartmentId,
    };

    const refreshPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    const userWithDepts = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['memberships', 'memberships.department'],
    });

    const userDto = this.mapUserToDto(userWithDepts);

    return {
      accessToken,
      refreshToken,
      user: userDto,
    };
  }

  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      activeDepartmentId: user.activeDepartmentId,
      departments: user.memberships.map((m) => ({
        id: m.department.id,
        name: m.department.name,
        description: m.department.description,
      })),
    };
  }
}
