import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginType, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../src/database/prisma.service';
import { UsersService } from '../../../src/users/users.service';

describe('UsersService Unit Tests', () => {
  let service: UsersService;

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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user-456', username: 'anotheruser' }];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should filter inactive users when requested', async () => {
      const activeUsers = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(activeUsers);

      await service.findAll({ where: { isActive: true } });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('User not found');
    });
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return user when username exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when username does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createUserDto = {
      username: 'newuser',
      longName: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      loginType: LoginType.EMAIL_PASSWORD,
      userType: UserType.CONTRIBUTOR,
    };

    it('should create a new user with hashed password', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null); // No duplicates
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        username: createUserDto.username,
        email: createUserDto.email,
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe(createUserDto.username);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: createUserDto.username,
          email: createUserDto.email,
          loginType: createUserDto.loginType,
          userType: createUserDto.userType,
          passwordHash: expect.any(String),
        }),
      });

      // Verify password was hashed
      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe(createUserDto.password);
      const isPasswordHashed = await bcrypt.compare(
        createUserDto.password,
        createCall.data.passwordHash,
      );
      expect(isPasswordHashed).toBe(true);
    });

    it('should throw ConflictException when username already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('username already exists');
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('email already exists');
    });

    it('should create user without password for federated login', async () => {
      const federatedUserDto = {
        username: 'googleuser',
        longName: 'Google User',
        email: 'google@example.com',
        loginType: LoginType.GOOGLE,
        userType: UserType.CONTRIBUTOR,
        password: undefined, // No password for federated login
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        username: federatedUserDto.username,
        loginType: LoginType.GOOGLE,
        passwordHash: null,
      });

      const result = await service.create(federatedUserDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: federatedUserDto.username,
          loginType: LoginType.GOOGLE,
          passwordHash: null,
        }),
      });
    });
  });

  describe('update', () => {
    const updateUserDto = {
      longName: 'Updated Name',
      isActive: false,
    };

    it('should update user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        longName: updateUserDto.longName,
        isActive: updateUserDto.isActive,
      });

      const result = await service.update('user-123', updateUserDto);

      expect(result).toBeDefined();
      expect(result.longName).toBe(updateUserDto.longName);
      expect(result.isActive).toBe(updateUserDto.isActive);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateUserDto,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update password and hash it', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const updateWithPassword = {
        password: 'newpassword123',
      };

      await service.update('user-123', updateWithPassword);

      const updateCall = mockPrismaService.user.update.mock.calls[0][0];
      expect(updateCall.data.passwordHash).toBeDefined();
      expect(updateCall.data.passwordHash).not.toBe('newpassword123');

      // Verify password was hashed
      const isPasswordHashed = await bcrypt.compare('newpassword123', updateCall.data.passwordHash);
      expect(isPasswordHashed).toBe(true);
    });

    it('should throw ConflictException when updating to existing username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        id: 'different-user-id',
      });

      await expect(service.update('user-123', { username: 'existingusername' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when updating to existing email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockUser,
        id: 'different-user-id',
      });

      await expect(service.update('user-123', { email: 'existing@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      await service.remove('user-123');

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Password Hashing', () => {
    it('should properly hash passwords with bcrypt', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

      // Verify the hash can be verified
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const plainPassword = 'correctPassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const isValid = await bcrypt.compare('wrongPassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle unique constraint violations', async () => {
      const createUserDto = {
        username: 'newuser',
        longName: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        loginType: LoginType.EMAIL_PASSWORD,
        userType: UserType.CONTRIBUTOR,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['username'] },
      });

      await expect(service.create(createUserDto)).rejects.toThrow();
    });
  });
});
