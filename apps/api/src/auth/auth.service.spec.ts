import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';
import { Department } from '../database/entities/department.entity';
import { UserDepartmentMembership } from '../database/entities/user-department-membership.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userRepository: any;
  let departmentRepository: any;
  let membershipRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRATION: '15m',
                JWT_REFRESH_EXPIRATION: '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Department),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserDepartmentMembership),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get(getRepositoryToken(User));
    departmentRepository = module.get(getRepositoryToken(Department));
    membershipRepository = module.get(getRepositoryToken(UserDepartmentMembership));
  });

  describe('login', () => {
    it('should return auth response on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        activeDepartmentId: 'dept-1',
        tokenVersion: 0,
        memberships: [{ departmentId: 'dept-1' }],
      };

      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid email', async () => {
      const loginDto = { email: 'nonexistent@example.com', password: 'password123' };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        activeDepartmentId: 'dept-1',
        tokenVersion: 0,
        memberships: [{ departmentId: 'dept-1' }],
      };

      userRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return auth response', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        departmentId: 'dept-1',
      };

      const department = { id: 'dept-1', name: 'Test Dept' };
      const newUser = {
        id: '1',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashedPassword',
        activeDepartmentId: 'dept-1',
        tokenVersion: 0,
        memberships: [{ departmentId: 'dept-1', department }],
      };

      userRepository.findOne.mockResolvedValue(null);
      departmentRepository.findOne.mockResolvedValue(department);
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw BadRequestException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        departmentId: 'dept-1',
      };

      userRepository.findOne.mockResolvedValue({ id: '1', email: 'existing@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('switchDepartment', () => {
    it('should switch user active department', async () => {
      const userId = '1';
      const switchDto = { departmentId: 'dept-2' };
      const user = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        activeDepartmentId: 'dept-1',
        tokenVersion: 0,
        memberships: [
          { departmentId: 'dept-1', department: { id: 'dept-1', name: 'Dept 1' } },
          { departmentId: 'dept-2', department: { id: 'dept-2', name: 'Dept 2' } },
        ],
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, activeDepartmentId: 'dept-2' });
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.switchDepartment(userId, switchDto);

      expect(result).toHaveProperty('accessToken');
      expect(userRepository.save).toHaveBeenCalled();
    });
  });
});
