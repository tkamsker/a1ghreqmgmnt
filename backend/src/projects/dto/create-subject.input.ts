import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

@InputType()
export class CreateSubjectInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  groupId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(0)
  orderIndex?: number;
}
