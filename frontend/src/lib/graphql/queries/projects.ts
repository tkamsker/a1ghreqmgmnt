import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      code
      description
      projectTypeId
      isActive
      createdBy
      createdAt
      updatedAt
      groups {
        id
        name
        description
        orderIndex
        subjects {
          id
          name
          description
          orderIndex
        }
      }
      subjects {
        id
        name
        description
        orderIndex
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      code
      description
      projectTypeId
      isActive
      createdBy
      createdAt
      updatedAt
      groups {
        id
        name
        description
        orderIndex
        subjects {
          id
          name
          description
          orderIndex
        }
      }
      subjects {
        id
        name
        description
        orderIndex
      }
    }
  }
`;
