/**
 * Shared types and utilities for Requirements Management System
 */

// Enums matching GraphQL schema
export enum LoginType {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  OIDC = 'OIDC',
  SAML = 'SAML',
}

export enum UserType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PROJECT_ADMIN = 'PROJECT_ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
  REVIEWER = 'REVIEWER',
}

export enum RequirementStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum SolutionStatus {
  DRAFT = 'DRAFT',
  DESIGNING = 'DESIGNING',
  IMPLEMENTING = 'IMPLEMENTING',
  DONE = 'DONE',
  DEPRECATED = 'DEPRECATED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskType {
  BACKEND = 'BACKEND',
  FRONTEND = 'FRONTEND',
  DEVOPS = 'DEVOPS',
  QA = 'QA',
  DOCUMENTATION = 'DOCUMENTATION',
  OTHER = 'OTHER',
}

export enum LinkType {
  SATISFIES = 'SATISFIES',
  IMPLEMENTS = 'IMPLEMENTS',
  REFINES = 'REFINES',
}

export enum TestType {
  MANUAL = 'MANUAL',
  AUTOMATED = 'AUTOMATED',
}

export enum TestRunStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED',
}

export enum IterationStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum AttachedToType {
  REQUIREMENT = 'REQUIREMENT',
  SOLUTION = 'SOLUTION',
  TASK = 'TASK',
  TEST = 'TEST',
  PROJECT = 'PROJECT',
}

export enum ImportExportType {
  REQIF_IMPORT = 'REQIF_IMPORT',
  REQIF_EXPORT = 'REQIF_EXPORT',
  MD_IMPORT = 'MD_IMPORT',
  MD_EXPORT = 'MD_EXPORT',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Common utility types
export type UUID = string;

export interface PaginationInput {
  first?: number;
  after?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
