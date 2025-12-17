import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../../../src/auth/auth.service';
import { AppConfigService } from '../../../src/config/config.service';
import { PrismaService } from '../../../src/database/prisma.service';

describe('AuthService Unit Tests', () => {
  let service: AuthService;

  // Mock user data
  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    longName: 'Test User',
    email: 'test@example.com',
    loginType: LoginType.EMAIL_PASSWORD,
    passwordHash: '$2b$10$mockhashedpassword',
    userType: UserType.CONTRIBUTOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    jwtSecret: 'test-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtExpiresIn: '15m',
    jwtRefreshExpiresIn: '7d',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const userWithHash = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithHash);

      const result = await service.validateUser('test@example.com', plainPassword);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithHash = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithHash);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user has no password (federated login)', async () => {
      const userWithoutPassword = {
        ...mockUser,
        loginType: LoginType.GOOGLE,
        passwordHash: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await service.validateUser('test@example.com', 'anypassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user data on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHash = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithHash);
      mockJwtService.sign.mockReturnValueOnce('mock-access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'mock-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await service.login('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.id).toBe(mockUser.id);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login('wrong@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException for inactive account', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const inactiveUser = {
        ...mockUser,
        passwordHash: hashedPassword,
        isActive: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('generateTokens', () => {
    it('should generate access token with correct payload', async () => {
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'mock-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await service.generateTokens(mockUser);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          userType: mockUser.userType,
        }),
        expect.any(Object),
      );
    });

    it('should create refresh token in database', async () => {
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'generated-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const result = await service.generateTokens(mockUser);

      expect(result.refreshToken).toBe('generated-refresh-token');
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('refreshToken', () => {
    it('should generate new tokens for valid refresh token', async () => {
      const mockRefreshToken = {
        id: 'token-123',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000000),
        createdAt: new Date(),
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.delete.mockResolvedValue(mockRefreshToken);
      mockJwtService.sign.mockReturnValue('new-access-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        ...mockRefreshToken,
        token: 'new-refresh-token',
      });

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredToken = {
        id: 'token-123',
        token: 'expired-token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue(expiredToken);

      await expect(service.refreshToken('expired-token')).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'expired-token' },
      });
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.logout(mockUser.id);

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });

    it('should handle logout when no tokens exist', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.logout(mockUser.id)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.validateUser('test@example.com', 'password123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle JWT signing errors', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userWithHash = {
        ...mockUser,
        passwordHash: hashedPassword,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithHash);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow(
        'JWT signing failed',
      );
    });
  });
});
