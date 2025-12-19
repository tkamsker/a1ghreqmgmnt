import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { RequirementStatus } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

import { CreateRequirementInput } from './dto/create-requirement.input';
import { UpdateRequirementStatusInput } from './dto/update-requirement-status.input';
import { UpdateRequirementInput } from './dto/update-requirement.input';

@Injectable()
export class RequirementsService {
  constructor(private prisma: PrismaService) {}

  // ==================== REQUIREMENT CRUD ====================

  async findAll(projectId: string) {
    return this.prisma.requirement.findMany({
      where: { projectId },
      include: {
        currentVersion: true,
        subject: true,
        parentRequirement: {
          include: {
            currentVersion: true,
          },
        },
        subRequirements: {
          include: {
            currentVersion: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        subject: true,
        parentRequirement: {
          include: {
            currentVersion: true,
          },
        },
        subRequirements: {
          include: {
            currentVersion: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    return requirement;
  }

  async create(input: CreateRequirementInput, userId: string) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${input.projectId} not found`);
    }

    // Verify subject exists if provided
    if (input.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: input.subjectId },
      });

      if (!subject) {
        throw new NotFoundException(`Subject with ID ${input.subjectId} not found`);
      }
    }

    // Verify parent requirement exists if provided
    if (input.parentRequirementId) {
      const parentRequirement = await this.prisma.requirement.findUnique({
        where: { id: input.parentRequirementId },
      });

      if (!parentRequirement) {
        throw new NotFoundException(
          `Parent requirement with ID ${input.parentRequirementId} not found`,
        );
      }
    }

    // Generate next UID for this project
    const existingRequirements = await this.prisma.requirement.findMany({
      where: { projectId: input.projectId },
      orderBy: { uid: 'desc' },
      take: 1,
    });

    let nextUidNumber = 1;
    if (existingRequirements.length > 0) {
      const lastUid = existingRequirements[0].uid;
      const match = lastUid.match(/REQ-(\d+)/);
      if (match) {
        nextUidNumber = parseInt(match[1], 10) + 1;
      }
    }
    const uid = `REQ-${String(nextUidNumber).padStart(4, '0')}`;

    // Check if UID already exists (should not happen, but safety check)
    const existingUid = await this.prisma.requirement.findUnique({
      where: {
        projectId_uid: {
          projectId: input.projectId,
          uid,
        },
      },
    });

    if (existingUid) {
      throw new ConflictException(`Requirement with UID "${uid}" already exists in this project`);
    }

    // Create requirement and first version in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the requirement
      const requirement = await tx.requirement.create({
        data: {
          uid,
          projectId: input.projectId,
          subjectId: input.subjectId,
          parentRequirementId: input.parentRequirementId,
          status: RequirementStatus.DRAFT,
          priority: input.priority,
          createdBy: userId,
        },
      });

      // Create the first version
      const version = await tx.requirementVersion.create({
        data: {
          requirementId: requirement.id,
          versionNumber: 1,
          title: input.title,
          statement: input.statement,
          rationale: input.rationale,
          tags: input.tags || [],
          createdBy: userId,
        },
      });

      // Update requirement with current version
      const updatedRequirement = await tx.requirement.update({
        where: { id: requirement.id },
        data: { currentVersionId: version.id },
        include: {
          currentVersion: true,
          subject: true,
          parentRequirement: {
            include: {
              currentVersion: true,
            },
          },
          subRequirements: {
            include: {
              currentVersion: true,
            },
          },
        },
      });

      return updatedRequirement;
    });

    return result;
  }

  async update(id: string, input: UpdateRequirementInput, userId: string) {
    // Find the requirement
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
      include: {
        currentVersion: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    // Get the latest version number
    const latestVersionNumber = requirement.versions[0]?.versionNumber || 0;
    const newVersionNumber = latestVersionNumber + 1;

    // Create a new version in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Mark the old version as no longer current
      if (requirement.currentVersionId) {
        await tx.requirementVersion.update({
          where: { id: requirement.currentVersionId },
          data: { effectiveTo: new Date() },
        });
      }

      // Create the new version
      const newVersion = await tx.requirementVersion.create({
        data: {
          requirementId: requirement.id,
          versionNumber: newVersionNumber,
          title: input.title,
          statement: input.statement,
          rationale: input.rationale,
          tags: input.tags || requirement.currentVersion?.tags || [],
          deltaNotes: input.deltaNotes,
          createdBy: userId,
        },
      });

      // Update requirement with new current version and priority
      const updatedRequirement = await tx.requirement.update({
        where: { id },
        data: {
          currentVersionId: newVersion.id,
          priority: input.priority,
        },
        include: {
          currentVersion: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
          subject: true,
          parentRequirement: {
            include: {
              currentVersion: true,
            },
          },
          subRequirements: {
            include: {
              currentVersion: true,
            },
          },
        },
      });

      return updatedRequirement;
    });

    return result;
  }

  async updateStatus(id: string, input: UpdateRequirementStatusInput) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    return this.prisma.requirement.update({
      where: { id },
      data: { status: input.status },
      include: {
        currentVersion: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        subject: true,
        parentRequirement: {
          include: {
            currentVersion: true,
          },
        },
        subRequirements: {
          include: {
            currentVersion: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID ${id} not found`);
    }

    await this.prisma.requirement.delete({ where: { id } });
    return true;
  }
}
