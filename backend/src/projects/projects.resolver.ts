import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserType } from '@prisma/client';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

import { CreateProjectGroupInput } from './dto/create-project-group.input';
import { CreateProjectInput } from './dto/create-project.input';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { Project, ProjectGroup, Subject } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@Resolver(() => Project)
@UseGuards(GqlAuthGuard, RolesGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  // ==================== PROJECT QUERIES ====================

  @Query(() => [Project], { name: 'projects' })
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR, UserType.REVIEWER)
  async findAll(@CurrentUser() user: { sub: string }) {
    return this.projectsService.findAll(user.sub);
  }

  @Query(() => Project, { name: 'project' })
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR, UserType.REVIEWER)
  async findOne(@Args('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // ==================== PROJECT MUTATIONS ====================

  @Mutation(() => Project)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async createProject(
    @Args('input') input: CreateProjectInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.create(input, user.sub);
  }

  @Mutation(() => Project)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async updateProject(@Args('id') id: string, @Args('input') input: UpdateProjectInput) {
    return this.projectsService.update(id, input);
  }

  @Mutation(() => Boolean)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async deleteProject(@Args('id') id: string) {
    return this.projectsService.remove(id);
  }

  // ==================== PROJECT GROUP MUTATIONS ====================

  @Mutation(() => ProjectGroup)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async createProjectGroup(@Args('input') input: CreateProjectGroupInput) {
    return this.projectsService.createGroup(input);
  }

  @Mutation(() => ProjectGroup)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async updateProjectGroup(
    @Args('id') id: string,
    @Args('name') name: string,
    @Args('description', { nullable: true }) description?: string,
  ) {
    return this.projectsService.updateGroup(id, name, description);
  }

  @Mutation(() => Boolean)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async deleteProjectGroup(@Args('id') id: string) {
    return this.projectsService.removeGroup(id);
  }

  // ==================== SUBJECT MUTATIONS ====================

  @Mutation(() => Subject)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR)
  async createSubject(@Args('input') input: CreateSubjectInput) {
    return this.projectsService.createSubject(input);
  }

  @Mutation(() => Subject)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR)
  async updateSubject(
    @Args('id') id: string,
    @Args('name') name: string,
    @Args('description', { nullable: true }) description?: string,
  ) {
    return this.projectsService.updateSubject(id, name, description);
  }

  @Mutation(() => Boolean)
  @Roles(UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN)
  async deleteSubject(@Args('id') id: string) {
    return this.projectsService.removeSubject(id);
  }
}
