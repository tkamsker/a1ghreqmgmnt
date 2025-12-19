import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserType } from '@prisma/client';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { CreateRequirementInput } from './dto/create-requirement.input';
import { UpdateRequirementStatusInput } from './dto/update-requirement-status.input';
import { UpdateRequirementInput } from './dto/update-requirement.input';
import { Requirement } from './entities/requirement.entity';
import { RequirementsService } from './requirements.service';

@Resolver(() => Requirement)
@UseGuards(GqlAuthGuard, RolesGuard)
export class RequirementsResolver {
  constructor(private readonly requirementsService: RequirementsService) {}

  // ==================== REQUIREMENT QUERIES ====================

  @Query(() => [Requirement], { name: 'requirements' })
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR, UserType.REVIEWER)
  async findAll(@Args('projectId') projectId: string) {
    return this.requirementsService.findAll(projectId);
  }

  @Query(() => Requirement, { name: 'requirement' })
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR, UserType.REVIEWER)
  async findOne(@Args('id') id: string) {
    return this.requirementsService.findOne(id);
  }

  // ==================== REQUIREMENT MUTATIONS ====================

  @Mutation(() => Requirement)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR)
  async createRequirement(
    @Args('input') input: CreateRequirementInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.requirementsService.create(input, user.sub);
  }

  @Mutation(() => Requirement)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR)
  async updateRequirement(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.requirementsService.update(id, input, user.sub);
  }

  @Mutation(() => Requirement)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.REVIEWER)
  async updateRequirementStatus(
    @Args('id') id: string,
    @Args('input') input: UpdateRequirementStatusInput,
  ) {
    return this.requirementsService.updateStatus(id, input);
  }

  @Mutation(() => Boolean)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async deleteRequirement(@Args('id') id: string) {
    return this.requirementsService.remove(id);
  }
}
