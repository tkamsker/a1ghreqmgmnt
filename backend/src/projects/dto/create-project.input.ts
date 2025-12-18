import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  code!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  projectTypeId!: string;
}
