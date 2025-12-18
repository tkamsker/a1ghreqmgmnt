import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsString()
  @MinLength(3)
  @IsOptional()
  username?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  longName?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
