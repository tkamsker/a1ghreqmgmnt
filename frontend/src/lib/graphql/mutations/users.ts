import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      username
      email
      longName
      userType
      isActive
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      username
      email
      longName
      userType
      isActive
    }
  }
`;

export const REMOVE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id)
  }
`;
