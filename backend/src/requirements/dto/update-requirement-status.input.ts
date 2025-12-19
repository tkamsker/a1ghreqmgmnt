import { Field, InputType } from '@nestjs/graphql';
import { RequirementStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateRequirementStatusInput {
  @Field(() => String)
  @IsEnum(RequirementStatus)
  @IsNotEmpty()
  status!: RequirementStatus;
}
