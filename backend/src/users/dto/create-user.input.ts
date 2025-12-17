import { InputType, Field } from '@nestjs/graphql';
import { LoginType, UserType } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  longName: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @Field(() => String)
  @IsEnum(LoginType)
  loginType: LoginType;

  @Field(() => String)
  @IsEnum(UserType)
  userType: UserType;
}
