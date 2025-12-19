import { gql } from '@apollo/client';

export const GET_REQUIREMENTS = gql`
  query GetRequirements($projectId: String!) {
    requirements(projectId: $projectId) {
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
        effectiveTo
        createdBy
        createdAt
      }
      subRequirements {
        id
        uid
        status
        priority
        currentVersion {
          id
          versionNumber
          title
          statement
        }
      }
      parentRequirement {
        id
        uid
        currentVersion {
          id
          title
        }
      }
    }
  }
`;

export const GET_REQUIREMENT = gql`
  query GetRequirement($id: String!) {
    requirement(id: $id) {
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
        effectiveTo
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
      subRequirements {
        id
        uid
        status
        priority
        currentVersion {
          id
          versionNumber
          title
          statement
        }
      }
      parentRequirement {
        id
        uid
        currentVersion {
          id
          title
        }
      }
    }
  }
`;
