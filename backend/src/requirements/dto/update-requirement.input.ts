import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, MinLength } from 'class-validator';

@InputType()
export class UpdateRequirementInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  statement!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  rationale?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  priority?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  deltaNotes?: string;
}
