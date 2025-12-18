# Data Model: Requirements Management System

**Date**: 2025-12-17
**Feature**: 001-monorepo-setup
**ORM**: Prisma (see research.md for decision rationale)

## Overview

This document defines the complete data model for the Requirements Management System using Prisma schema notation. The model supports:
- Hierarchical projects with groups and subjects
- Versioned requirements, solutions, and tasks
- Traceability links between requirements, solutions, tasks, and tests
- Role-based access control
- File attachments with S3 storage
- Import/export job tracking

## Schema Conventions

- **IDs**: UUIDs for all primary keys (`@id @default(uuid())`)
- **Timestamps**: `createdAt` and `updatedAt` on all main entities
- **Soft Delete**: `deletedAt` field for soft deletion (not shown to reduce complexity initially)
- **Indexes**: Added on frequently queried columns (`@@index([field])`)
- **Unique Constraints**: Composite unique keys where needed (`@@unique([field1, field2])`)

---

## Core Entities

### User

Represents system users with authentication and role information.

```prisma
enum LoginType {
  EMAIL_PASSWORD
  GOOGLE
  GITHUB
  OIDC
  SAML
}

enum UserType {
  SUPER_ADMIN
  PROJECT_ADMIN
  CONTRIBUTOR
  REVIEWER
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  longName     String    // Full display name
  email        String?   @unique
  loginType    LoginType
  passwordHash String?   // Null for federated logins
  isActive     Boolean   @default(true)
  userType     UserType
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relationships
  createdProjects      Project[]
  createdRequirements  Requirement[]
  createdSolutions     Solution[]
  createdTasks         Task[]
  createdTests         TestCase[]
  executedTestRuns     TestRun[]
  uploadedAttachments  Attachment[]
  createdImportExportJobs ImportExportJob[]
  refreshTokens        RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("refresh_tokens")
}
```

**Validation Rules**:
- `email` must be valid email format (validated by class-validator)
- `passwordHash` required if `loginType` is `EMAIL_PASSWORD`
- `username` must be 3-50 characters, alphanumeric + underscore/hyphen

---

### ProjectType

Super Admin-managed templates for project categories.

```prisma
model ProjectType {
  id              String   @id @default(uuid())
  name            String   @unique
  description     String?
  defaultSettings Json?    // Flexible JSON for project-specific config
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  projects Project[]

  @@map("project_types")
}
```

---

### Project

Top-level container for requirements work.

```prisma
model Project {
  id            String    @id @default(uuid())
  name          String
  code          String    // Short unique identifier like "RMS" or "AUTH"
  description   String?
  projectTypeId String
  isActive      Boolean   @default(true)
  createdBy     String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relationships
  projectType  ProjectType     @relation(fields: [projectTypeId], references: [id])
  creator      User            @relation(fields: [createdBy], references: [id])
  groups       ProjectGroup[]
  subjects     Subject[]
  requirements Requirement[]
  solutions    Solution[]
  tasks        Task[]
  iterations   Iteration[]
  testCases    TestCase[]
  attachments  Attachment[]
  importExportJobs ImportExportJob[]

  @@unique([code])
  @@index([isActive])
  @@index([createdAt])
  @@map("projects")
}
```

**Validation Rules**:
- `code` must be 2-10 characters, uppercase letters and numbers only
- `name` must be 3-100 characters

---

### ProjectGroup

Organizational unit within a project for grouping subjects.

```prisma
model ProjectGroup {
  id          String   @id @default(uuid())
  projectId   String
  name        String
  description String?
  orderIndex  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  project  Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  subjects Subject[]

  @@index([projectId])
  @@index([orderIndex])
  @@map("project_groups")
}
```

---

### Subject

Thematic area within a project for organizing requirements.

```prisma
model Subject {
  id          String   @id @default(uuid())
  projectId   String
  groupId     String?  // Null if top-level subject
  name        String
  description String?
  orderIndex  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  project      Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  group        ProjectGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
  requirements Requirement[]

  @@index([projectId])
  @@index([groupId])
  @@index([orderIndex])
  @@map("subjects")
}
```

---

## Requirements and Versioning

### Requirement

Core entity representing a requirement with version management.

```prisma
enum RequirementStatus {
  DRAFT
  REVIEW
  APPROVED
  DEPRECATED
  ARCHIVED
}

model Requirement {
  id                  String            @id @default(uuid())
  uid                 String            // REQ-001, REQ-002, etc. (unique per project)
  projectId           String
  subjectId           String?
  parentRequirementId String?           // For sub-requirements
  currentVersionId    String?           @unique
  status              RequirementStatus @default(DRAFT)
  priority            Int?              // 1 (high) to 5 (low)
  createdBy           String
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  // Relationships
  project           Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  subject           Subject?             @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  parentRequirement Requirement?         @relation("RequirementHierarchy", fields: [parentRequirementId], references: [id], onDelete: Cascade)
  subRequirements   Requirement[]        @relation("RequirementHierarchy")
  creator           User                 @relation(fields: [createdBy], references: [id])
  versions          RequirementVersion[] @relation("RequirementVersions")
  currentVersion    RequirementVersion?  @relation("CurrentVersion", fields: [currentVersionId], references: [id], onDelete: SetNull)
  solutionLinks     RequirementSolutionLink[]
  testLinks         RequirementTestLink[]
  iterationItems    IterationItem[]

  @@unique([projectId, uid])
  @@index([projectId])
  @@index([subjectId])
  @@index([status])
  @@index([createdAt])
  @@map("requirements")
}
```

**Validation Rules**:
- `uid` must match pattern `REQ-\d+` or similar project-specific format
- `priority` must be between 1 and 5 if provided

---

### RequirementVersion

Immutable version record for requirements.

```prisma
model RequirementVersion {
  id            String   @id @default(uuid())
  requirementId String
  versionNumber Int      // 1, 2, 3, ... (monotonically increasing)
  title         String
  statement     String   // Markdown content
  rationale     String?  // Markdown content
  tags          String[] // Array of tags
  deltaNotes    String?  // What changed from previous version
  effectiveFrom DateTime @default(now())
  effectiveTo   DateTime? // Null if current version
  createdBy     String
  createdAt     DateTime @default(now())

  // Relationships
  requirement       Requirement  @relation("RequirementVersions", fields: [requirementId], references: [id], onDelete: Cascade)
  creator           User         @relation(fields: [createdBy], references: [id])
  currentForRequirement Requirement? @relation("CurrentVersion")

  @@unique([requirementId, versionNumber])
  @@index([requirementId])
  @@index([createdAt])
  @@map("requirement_versions")
}
```

**Versioning Logic**:
- New version created on every edit
- Previous version's `effectiveTo` set to current timestamp
- New version's `versionNumber` = max(existing versions) + 1
- `currentVersionId` on `Requirement` updated to new version

---

## Solutions and Tasks

### Solution

Implementation approach for requirements.

```prisma
enum SolutionStatus {
  DRAFT
  DESIGNING
  IMPLEMENTING
  DONE
  DEPRECATED
}

model Solution {
  id               String         @id @default(uuid())
  code             String         // SOL-001, SOL-002, etc. (unique per project)
  projectId        String
  parentSolutionId String?        // For hierarchical solutions
  currentVersionId String?        @unique
  status           SolutionStatus @default(DRAFT)
  createdBy        String
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // Relationships
  project        Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentSolution Solution?            @relation("SolutionHierarchy", fields: [parentSolutionId], references: [id], onDelete: Cascade)
  subSolutions   Solution[]           @relation("SolutionHierarchy")
  creator        User                 @relation(fields: [createdBy], references: [id])
  versions       SolutionVersion[]    @relation("SolutionVersions")
  currentVersion SolutionVersion?     @relation("CurrentVersion", fields: [currentVersionId], references: [id], onDelete: SetNull)
  requirementLinks RequirementSolutionLink[]
  tasks          Task[]
  testLinks      SolutionTestLink[]

  @@unique([projectId, code])
  @@index([projectId])
  @@index([status])
  @@index([createdAt])
  @@map("solutions")
}
```

---

### SolutionVersion

Immutable version record for solutions.

```prisma
model SolutionVersion {
  id                String   @id @default(uuid())
  solutionId        String
  versionNumber     Int      // 1, 2, 3, ...
  title             String
  description       String   // Markdown content
  architectureNotes String?  // Markdown content
  tags              String[] // Array of tags
  createdBy         String
  createdAt         DateTime @default(now())

  // Relationships
  solution            Solution  @relation("SolutionVersions", fields: [solutionId], references: [id], onDelete: Cascade)
  creator             User      @relation(fields: [createdBy], references: [id])
  currentForSolution  Solution? @relation("CurrentVersion")

  @@unique([solutionId, versionNumber])
  @@index([solutionId])
  @@index([createdAt])
  @@map("solution_versions")
}
```

---

### RequirementSolutionLink

Traceability link between requirement and solution.

```prisma
enum LinkType {
  SATISFIES     // Solution satisfies requirement
  IMPLEMENTS    // Solution implements requirement
  REFINES       // Solution refines requirement (more detailed)
}

model RequirementSolutionLink {
  id            String   @id @default(uuid())
  requirementId String
  solutionId    String
  linkType      LinkType @default(SATISFIES)
  createdAt     DateTime @default(now())

  // Relationships
  requirement Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  solution    Solution    @relation(fields: [solutionId], references: [id], onDelete: Cascade)

  @@unique([requirementId, solutionId])
  @@index([requirementId])
  @@index([solutionId])
  @@map("requirement_solution_links")
}
```

---

### Task

Work item derived from solutions.

```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  DONE
  ARCHIVED
}

enum TaskType {
  BACKEND
  FRONTEND
  DEVOPS
  QA
  DOCUMENTATION
  OTHER
}

model Task {
  id               String     @id @default(uuid())
  projectId        String
  solutionId       String
  currentVersionId String?    @unique
  status           TaskStatus @default(TODO)
  createdBy        String
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  // Relationships
  project        Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  solution       Solution       @relation(fields: [solutionId], references: [id], onDelete: Cascade)
  creator        User           @relation(fields: [createdBy], references: [id])
  versions       TaskVersion[]  @relation("TaskVersions")
  currentVersion TaskVersion?   @relation("CurrentVersion", fields: [currentVersionId], references: [id], onDelete: SetNull)
  iterationItems IterationItem[]

  @@index([projectId])
  @@index([solutionId])
  @@index([status])
  @@index([createdAt])
  @@map("tasks")
}
```

---

### TaskVersion

Immutable version record for tasks.

```prisma
model TaskVersion {
  id            String   @id @default(uuid())
  taskId        String
  versionNumber Int      // 1, 2, 3, ...
  title         String
  description   String   // Markdown content
  type          TaskType
  estimate      Float?   // Story points or hours
  createdBy     String
  createdAt     DateTime @default(now())

  // Relationships
  task          Task  @relation("TaskVersions", fields: [taskId], references: [id], onDelete: Cascade)
  creator       User  @relation(fields: [createdBy], references: [id])
  currentForTask Task? @relation("CurrentVersion")

  @@unique([taskId, versionNumber])
  @@index([taskId])
  @@index([createdAt])
  @@map("task_versions")
}
```

---

## Iterations (Sprints)

### Iteration

Time-boxed development cycle.

```prisma
enum IterationStatus {
  PLANNED
  ACTIVE
  COMPLETED
}

model Iteration {
  id             String          @id @default(uuid())
  projectId      String
  name           String
  iterationIndex Int             // 1, 2, 3, ... (Sprint 1, Sprint 2, etc.)
  startDate      DateTime
  endDate        DateTime
  status         IterationStatus @default(PLANNED)
  goals          String?         // Markdown content
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  // Relationships
  project Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  items   IterationItem[]
  testRuns TestRun[]

  @@unique([projectId, iterationIndex])
  @@index([projectId])
  @@index([status])
  @@index([startDate])
  @@map("iterations")
}
```

---

### IterationItem

Assignment of a task or requirement to an iteration.

```prisma
model IterationItem {
  id             String   @id @default(uuid())
  iterationId    String
  taskId         String?
  requirementId  String?
  statusOverride String?  // Optional override for item status within iteration
  createdAt      DateTime @default(now())

  // Relationships
  iteration   Iteration    @relation(fields: [iterationId], references: [id], onDelete: Cascade)
  task        Task?        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  requirement Requirement? @relation(fields: [requirementId], references: [id], onDelete: Cascade)

  @@index([iterationId])
  @@index([taskId])
  @@index([requirementId])
  @@map("iteration_items")
}
```

**Validation Rules**:
- At least one of `taskId` or `requirementId` must be set (enforced in application logic)

---

## Test Management

### TestCase

Test definition.

```prisma
enum TestType {
  MANUAL
  AUTOMATED
}

model TestCase {
  id          String   @id @default(uuid())
  projectId   String
  name        String
  description String   // Markdown content
  type        TestType
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  project           Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator           User                 @relation(fields: [createdBy], references: [id])
  requirementLinks  RequirementTestLink[]
  solutionLinks     SolutionTestLink[]
  testRuns          TestRun[]

  @@index([projectId])
  @@index([type])
  @@index([createdAt])
  @@map("test_cases")
}
```

---

### TestRun

Execution record of a test case.

```prisma
enum TestRunStatus {
  PASSED
  FAILED
  BLOCKED
  SKIPPED
}

model TestRun {
  id          String        @id @default(uuid())
  testId      String
  iterationId String?
  status      TestRunStatus
  notes       String?       // Markdown content
  executedBy  String
  executedAt  DateTime      @default(now())

  // Relationships
  test      TestCase   @relation(fields: [testId], references: [id], onDelete: Cascade)
  iteration Iteration? @relation(fields: [iterationId], references: [id], onDelete: SetNull)
  executor  User       @relation(fields: [executedBy], references: [id])

  @@index([testId])
  @@index([iterationId])
  @@index([status])
  @@index([executedAt])
  @@map("test_runs")
}
```

---

### RequirementTestLink

Traceability link between requirement and test case.

```prisma
model RequirementTestLink {
  id            String   @id @default(uuid())
  requirementId String
  testId        String
  createdAt     DateTime @default(now())

  // Relationships
  requirement Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  test        TestCase    @relation(fields: [testId], references: [id], onDelete: Cascade)

  @@unique([requirementId, testId])
  @@index([requirementId])
  @@index([testId])
  @@map("requirement_test_links")
}
```

---

### SolutionTestLink

Traceability link between solution and test case.

```prisma
model SolutionTestLink {
  id         String   @id @default(uuid())
  solutionId String
  testId     String
  createdAt  DateTime @default(now())

  // Relationships
  solution Solution @relation(fields: [solutionId], references: [id], onDelete: Cascade)
  test     TestCase @relation(fields: [testId], references: [id], onDelete: Cascade)

  @@unique([solutionId, testId])
  @@index([solutionId])
  @@index([testId])
  @@map("solution_test_links")
}
```

---

## File Attachments

### Attachment

File reference with S3 storage.

```prisma
enum AttachedToType {
  REQUIREMENT
  SOLUTION
  TASK
  TEST
  PROJECT
}

model Attachment {
  id             String         @id @default(uuid())
  projectId      String
  attachedToType AttachedToType
  attachedToId   String         // ID of the entity this attachment belongs to
  s3Key          String         // S3 object key
  fileName       String
  mimeType       String
  size           Int            // Bytes
  uploadedBy     String
  uploadedAt     DateTime       @default(now())

  // Relationships
  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  uploader User    @relation(fields: [uploadedBy], references: [id])

  @@index([projectId])
  @@index([attachedToType, attachedToId])
  @@index([uploadedAt])
  @@map("attachments")
}
```

**S3 Key Format**: `{projectId}/{attachedToType}/{attachedToId}/{uuid}-{fileName}`
**Example**: `abc-123/REQUIREMENT/def-456/7890-diagram.png`

---

## Import/Export Jobs

### ImportExportJob

Asynchronous job record for ReqIF/Markdown import/export.

```prisma
enum ImportExportType {
  REQIF_IMPORT
  REQIF_EXPORT
  MD_IMPORT
  MD_EXPORT
}

enum JobStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
}

model ImportExportJob {
  id           String            @id @default(uuid())
  projectId    String
  type         ImportExportType
  status       JobStatus         @default(QUEUED)
  sourceS3Key  String?           // S3 key for input file (imports)
  resultS3Key  String?           // S3 key for output file (exports)
  log          String?           // Detailed log of operations
  createdBy    String
  createdAt    DateTime          @default(now())
  finishedAt   DateTime?

  // Relationships
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator User    @relation(fields: [createdBy], references: [id])

  @@index([projectId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@map("import_export_jobs")
}
```

---

## Indexes Summary

Key indexes for query performance:

| Table | Indexed Columns | Purpose |
|-------|----------------|---------|
| `requirements` | `projectId` | Filter requirements by project |
| `requirements` | `status` | Filter by status (DRAFT, APPROVED, etc.) |
| `requirements` | `createdAt` | Sort by creation date |
| `requirement_versions` | `requirementId` | Fetch all versions of a requirement |
| `requirement_solution_links` | `requirementId`, `solutionId` | Bi-directional traceability queries |
| `tasks` | `solutionId` | Fetch all tasks for a solution |
| `tasks` | `status` | Filter tasks by status |
| `iteration_items` | `iterationId` | Fetch all items in an iteration |
| `test_runs` | `testId` | Fetch all runs for a test case |
| `attachments` | `attachedToType`, `attachedToId` | Fetch all attachments for an entity |

---

## Entity Relationship Diagram

```
User
  ├─ creates ──→ Project
  ├─ creates ──→ Requirement
  ├─ creates ──→ Solution
  ├─ creates ──→ Task
  ├─ creates ──→ TestCase
  ├─ executes ─→ TestRun
  └─ uploads ──→ Attachment

Project
  ├─ has ──→ ProjectType
  ├─ contains ─→ ProjectGroup
  │   └─ contains ─→ Subject
  ├─ contains ─→ Requirement
  │   ├─ has ─→ RequirementVersion (versioned)
  │   ├─ links to ─→ Solution (via RequirementSolutionLink)
  │   ├─ links to ─→ TestCase (via RequirementTestLink)
  │   └─ assigned to ─→ Iteration (via IterationItem)
  ├─ contains ─→ Solution
  │   ├─ has ─→ SolutionVersion (versioned)
  │   ├─ contains ─→ Task
  │   │   ├─ has ─→ TaskVersion (versioned)
  │   │   └─ assigned to ─→ Iteration (via IterationItem)
  │   └─ links to ─→ TestCase (via SolutionTestLink)
  ├─ contains ─→ TestCase
  │   └─ has ─→ TestRun (execution records)
  ├─ contains ─→ Iteration
  │   └─ contains ─→ IterationItem
  ├─ contains ─→ Attachment
  └─ has ─→ ImportExportJob
```

---

## Migration Strategy

1. **Initial Migration**: Create all tables and indexes
2. **Seed Data**: Create Super Admin user, default ProjectTypes
3. **Versioned Migrations**: All schema changes via `prisma migrate dev`
4. **Rollback Support**: Keep migrations reversible where possible

**Migration Commands**:
```bash
# Create and apply migration
pnpm prisma migrate dev --name init_schema

# Apply migrations in production
pnpm prisma migrate deploy

# Generate Prisma Client
pnpm prisma generate

# Seed database
pnpm prisma db seed
```

---

## Data Integrity Rules

1. **Cascade Deletes**: Deleting a Project cascades to all contained entities
2. **Version Immutability**: Once created, version records are never modified
3. **Current Version Consistency**: `currentVersionId` always points to latest version
4. **UID Uniqueness**: UIDs (REQ-001, SOL-001) unique within project, not globally
5. **Soft Delete**: Main entities marked as deleted but not removed (deletedAt field to be added in future)

---

## Next Steps

- Define GraphQL schema based on this data model (contracts/)
- Implement Prisma seed script for development data
- Create database migration scripts
- Implement repository layer with Prisma Client
