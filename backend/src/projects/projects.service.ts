import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { CreateProjectGroupInput } from './dto/create-project-group.input';
import { CreateSubjectInput } from './dto/create-subject.input';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PROJECT CRUD ====================

  async findAll(_userId: string) {
    // For now, return all active projects
    // TODO: Implement project-level permissions based on _userId
    return this.prisma.project.findMany({
      where: { isActive: true },
      include: {
        projectType: true,
        groups: {
          orderBy: { orderIndex: 'asc' },
          include: {
            subjects: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        subjects: {
          where: { groupId: null }, // Top-level subjects (not in groups)
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        projectType: true,
        groups: {
          orderBy: { orderIndex: 'asc' },
          include: {
            subjects: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        subjects: {
          where: { groupId: null },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(input: CreateProjectInput, userId: string) {
    // Check if code is unique
    const existing = await this.prisma.project.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictException(`Project with code "${input.code}" already exists`);
    }

    // Verify project type exists
    const projectType = await this.prisma.projectType.findUnique({
      where: { id: input.projectTypeId },
    });

    if (!projectType) {
      throw new NotFoundException(`ProjectType with ID ${input.projectTypeId} not found`);
    }

    return this.prisma.project.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        projectTypeId: input.projectTypeId,
        createdBy: userId,
      },
      include: {
        projectType: true,
        groups: true,
        subjects: true,
      },
    });
  }

  async update(id: string, input: UpdateProjectInput) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return this.prisma.project.update({
      where: { id },
      data: input,
      include: {
        projectType: true,
        groups: true,
        subjects: true,
      },
    });
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.prisma.project.delete({ where: { id } });
    return true;
  }

  // ==================== PROJECT GROUP CRUD ====================

  async createGroup(input: CreateProjectGroupInput) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${input.projectId} not found`);
    }

    return this.prisma.projectGroup.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        orderIndex: input.orderIndex ?? 0,
      },
      include: {
        subjects: true,
      },
    });
  }

  async updateGroup(id: string, name: string, description?: string) {
    const group = await this.prisma.projectGroup.findUnique({ where: { id } });

    if (!group) {
      throw new NotFoundException(`ProjectGroup with ID ${id} not found`);
    }

    return this.prisma.projectGroup.update({
      where: { id },
      data: { name, description },
      include: {
        subjects: true,
      },
    });
  }

  async removeGroup(id: string) {
    const group = await this.prisma.projectGroup.findUnique({ where: { id } });

    if (!group) {
      throw new NotFoundException(`ProjectGroup with ID ${id} not found`);
    }

    await this.prisma.projectGroup.delete({ where: { id } });
    return true;
  }

  // ==================== SUBJECT CRUD ====================

  async createSubject(input: CreateSubjectInput) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${input.projectId} not found`);
    }

    // If groupId provided, verify it exists
    if (input.groupId) {
      const group = await this.prisma.projectGroup.findUnique({
        where: { id: input.groupId },
      });

      if (!group) {
        throw new NotFoundException(`ProjectGroup with ID ${input.groupId} not found`);
      }
    }

    return this.prisma.subject.create({
      data: {
        projectId: input.projectId,
        groupId: input.groupId,
        name: input.name,
        description: input.description,
        orderIndex: input.orderIndex ?? 0,
      },
    });
  }

  async updateSubject(id: string, name: string, description?: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return this.prisma.subject.update({
      where: { id },
      data: { name, description },
    });
  }

  async removeSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    await this.prisma.subject.delete({ where: { id } });
    return true;
  }
}
