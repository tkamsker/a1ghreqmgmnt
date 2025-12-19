import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  code!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  projectTypeId!: string;

  @Field()
  isActive!: boolean;

  @Field()
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [ProjectGroup], { nullable: true })
  groups?: ProjectGroup[];

  @Field(() => [Subject], { nullable: true })
  subjects?: Subject[];
}

@ObjectType()
export class ProjectGroup {
  @Field(() => ID)
  id!: string;

  @Field()
  projectId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  orderIndex!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => [Subject], { nullable: true })
  subjects?: Subject[];
}

@ObjectType()
export class Subject {
  @Field(() => ID)
  id!: string;

  @Field()
  projectId!: string;

  @Field({ nullable: true })
  groupId?: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  orderIndex!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
