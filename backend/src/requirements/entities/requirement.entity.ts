import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RequirementStatus } from '@prisma/client';

// Register the enum for GraphQL
registerEnumType(RequirementStatus, {
  name: 'RequirementStatus',
  description: 'The status of a requirement',
});

@ObjectType()
export class RequirementVersion {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  requirementId!: string;

  @Field(() => Int)
  versionNumber!: number;

  @Field()
  title!: string;

  @Field()
  statement!: string;

  @Field({ nullable: true })
  rationale?: string;

  @Field(() => [String])
  tags!: string[];

  @Field({ nullable: true })
  deltaNotes?: string;

  @Field()
  effectiveFrom!: Date;

  @Field({ nullable: true })
  effectiveTo?: Date;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class Requirement {
  @Field(() => ID)
  id!: string;

  @Field()
  uid!: string;

  @Field(() => ID)
  projectId!: string;

  @Field(() => ID, { nullable: true })
  subjectId?: string;

  @Field(() => ID, { nullable: true })
  parentRequirementId?: string;

  @Field(() => ID, { nullable: true })
  currentVersionId?: string;

  @Field(() => RequirementStatus)
  status!: RequirementStatus;

  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field(() => ID)
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field(() => RequirementVersion, { nullable: true })
  currentVersion?: RequirementVersion;

  @Field(() => [RequirementVersion], { nullable: true })
  versions?: RequirementVersion[];

  @Field(() => [Requirement], { nullable: true })
  subRequirements?: Requirement[];

  @Field(() => Requirement, { nullable: true })
  parentRequirement?: Requirement;
}
