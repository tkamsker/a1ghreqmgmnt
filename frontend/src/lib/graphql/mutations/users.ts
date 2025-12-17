import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(createUserInput: $input) {
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
    updateUser(id: $id, updateUserInput: $input) {
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
  mutation RemoveUser($id: String!) {
    removeUser(id: $id) {
      id
      username
    }
  }
`;
