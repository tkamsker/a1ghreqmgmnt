import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { LoginType, UserType } from '@prisma/client';

// Register enums for GraphQL
registerEnumType(LoginType, {
  name: 'LoginType',
  description: 'Type of login authentication',
});

registerEnumType(UserType, {
  name: 'UserType',
  description: 'User role type',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;

  @Field()
  longName: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => LoginType)
  loginType: LoginType;

  @Field(() => UserType)
  userType: UserType;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // passwordHash is intentionally not exposed in GraphQL
}
