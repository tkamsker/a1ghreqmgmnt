import { gql } from '@apollo/client';

export const CREATE_REQUIREMENT = gql`
  mutation CreateRequirement($input: CreateRequirementInput!) {
    createRequirement(input: $input) {
      id
      uid
      projectId
      subjectId
      parentRequirementId
      currentVersionId
      status
      priority
      createdBy
      createdAt
      updatedAt
      currentVersion {
        id
        versionNumber
        title
        statement
        rationale
        tags
        deltaNotes
        effectiveFrom
        createdBy
        createdAt
      }
    }
  }
`;

export const UPDATE_REQUIREMENT = gql`
  mutation UpdateRequirement($id: String!, $input: UpdateRequirementInput!) {
    updateRequirement(id: $id, input: $input) {
      id
      uid
      projectId
      subjectId
      parentRequirementId
      currentVersionId
      status
      priority
      createdBy
      createdAt
      updatedAt
      currentVersion {
        id
        versionNumber
        title
        statement
        rationale
        tags
        deltaNotes
        effectiveFrom
        createdBy
        createdAt
      }
      versions {
        id
        versionNumber
        title
        statement
        rationale
        tags
        deltaNotes
        effectiveFrom
        effectiveTo
        createdBy
        createdAt
      }
    }
  }
`;

export const UPDATE_REQUIREMENT_STATUS = gql`
  mutation UpdateRequirementStatus($id: String!, $input: UpdateRequirementStatusInput!) {
    updateRequirementStatus(id: $id, input: $input) {
      id
      uid
      status
      updatedAt
    }
  }
`;

export const DELETE_REQUIREMENT = gql`
  mutation DeleteRequirement($id: String!) {
    deleteRequirement(id: $id)
  }
`;
