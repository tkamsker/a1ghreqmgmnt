import { gql } from '@apollo/client';

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      code
      description
      projectTypeId
      isActive
      createdAt
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: String!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
      isActive
      updatedAt
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id)
  }
`;

export const CREATE_PROJECT_GROUP = gql`
  mutation CreateProjectGroup($input: CreateProjectGroupInput!) {
    createProjectGroup(input: $input) {
      id
      projectId
      name
      description
      orderIndex
      createdAt
    }
  }
`;

export const UPDATE_PROJECT_GROUP = gql`
  mutation UpdateProjectGroup($id: String!, $name: String!, $description: String) {
    updateProjectGroup(id: $id, name: $name, description: $description) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_PROJECT_GROUP = gql`
  mutation DeleteProjectGroup($id: String!) {
    deleteProjectGroup(id: $id)
  }
`;

export const CREATE_SUBJECT = gql`
  mutation CreateSubject($input: CreateSubjectInput!) {
    createSubject(input: $input) {
      id
      projectId
      groupId
      name
      description
      orderIndex
      createdAt
    }
  }
`;

export const UPDATE_SUBJECT = gql`
  mutation UpdateSubject($id: String!, $name: String!, $description: String) {
    updateSubject(id: $id, name: $name, description: $description) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_SUBJECT = gql`
  mutation DeleteSubject($id: String!) {
    deleteSubject(id: $id)
  }
`;
