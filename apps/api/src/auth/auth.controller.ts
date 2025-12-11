import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SwitchDepartmentDto } from './dto/switch-department.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponse, JwtPayload } from '@shams-vision/shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refreshToken } = refreshTokenDto;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Extract userId from the token
    const decoded = this.decodeToken(refreshToken);
    if (!decoded || !decoded.userId) {
      throw new BadRequestException('Invalid refresh token');
    }

    return this.authService.refreshToken(refreshToken, decoded.userId);
  }

  @Post('switch-department')
  @UseGuards(JwtAuthGuard)
  async switchDepartment(
    @Request() req: { user: JwtPayload },
    @Body() switchDto: SwitchDepartmentDto,
  ): Promise<AuthResponse> {
    return this.authService.switchDepartment(req.user.userId, switchDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: JwtPayload }): JwtPayload {
    return req.user;
  }

  private decodeToken(token: string): Record<string, unknown> {
    try {
      // Simple base64 decode for JWT payload
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}
