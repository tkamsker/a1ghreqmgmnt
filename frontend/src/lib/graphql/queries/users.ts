import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      email
      longName
      userType
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: String!) {
    user(id: $id) {
      id
      username
      email
      longName
      userType
      loginType
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      id
      username
      email
      longName
      userType
      isActive
    }
  }
`;
