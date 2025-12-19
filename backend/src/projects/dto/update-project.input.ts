import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
