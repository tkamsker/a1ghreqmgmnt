# Tasks: Monorepo Requirements Management System

**Input**: Design documents from `/specs/001-monorepo-setup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/graphql-schema-core.graphql

**Tests**: Constitution requires TDD approach (Principle II). Tests are MANDATORY and must be written FIRST before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo root**: `/Users/thomaskamsker/Documents/Atom/vron.one/playground/A1Reqmgmnt/a1ghreqmgmnt/`
- **Backend**: `backend/src/` for source, `backend/test/` for tests
- **Frontend**: `frontend/src/` for source, `frontend/test/` for tests
- **Shared**: `shared/` for shared code
- **Infrastructure**: `infra/` for Docker and deployment

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize monorepo with pnpm workspaces in root package.json
- [ ] T002 [P] Install and configure Turborepo with turbo.json defining build, test, lint, dev pipelines
- [ ] T003 [P] Create backend package structure with package.json, tsconfig.json, and NestJS CLI
- [ ] T004 [P] Create frontend package structure with package.json, tsconfig.json, and Next.js
- [ ] T005 [P] Create shared package structure with package.json and tsconfig.json for shared types
- [ ] T006 [P] Configure ESLint root config in .eslintrc.js with TypeScript rules
- [ ] T007 [P] Configure Prettier in .prettierrc with consistent formatting rules
- [ ] T008 [P] Setup Husky pre-commit hooks in .husky/ to run linting and formatting
- [ ] T009 [P] Create root tsconfig.base.json with strict mode and path aliases
- [ ] T010 [P] Create Docker Compose file in infra/docker-compose.yml with PostgreSQL and MinIO services
- [ ] T011 [P] Create backend Dockerfile with multi-stage build (development and production targets)
- [ ] T012 [P] Create frontend Dockerfile with multi-stage build
- [ ] T013 [P] Create .env.example files for backend, frontend, and root with documented variables
- [ ] T014 [P] Setup GitHub Actions CI workflow in .github/workflows/ci.yml for lint, test, build
- [ ] T015 [P] Create README.md with project overview and quickstart instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T016 Initialize Prisma in backend/prisma/ with schema.prisma file
- [ ] T017 [P] Define Prisma schema enums in backend/prisma/schema.prisma (LoginType, UserType, RequirementStatus, etc.)
- [ ] T018 [P] Define base Prisma models in backend/prisma/schema.prisma (User, RefreshToken, ProjectType)
- [ ] T019 [P] Configure NestJS main.ts with GraphQL module, validation pipes, and Sentry
- [ ] T020 [P] Create NestJS config module in backend/src/config/ for environment variables
- [ ] T021 [P] Setup Prisma service in backend/src/database/prisma.service.ts as global provider
- [ ] T022 [P] Create base exception filters in backend/src/common/filters/ for GraphQL errors
- [ ] T023 [P] Create logging interceptor in backend/src/common/interceptors/logging.interceptor.ts
- [ ] T024 [P] Setup JWT auth guards in backend/src/auth/guards/ (GqlAuthGuard, RolesGuard)
- [ ] T025 [P] Create custom decorators in backend/src/common/decorators/ (CurrentUser, Roles)
- [ ] T026 [P] Configure Apollo Client in frontend/src/lib/apollo-client.ts with auth headers
- [ ] T027 [P] Create Next.js root layout in frontend/src/app/layout.tsx with Apollo Provider
- [ ] T028 [P] Setup Tailwind CSS in frontend with tailwind.config.ts and global styles
- [ ] T029 [P] Install and configure Shadcn/ui components in frontend/src/components/ui/
- [ ] T030 [P] Create shared TypeScript types in shared/types/ from Prisma schema
- [ ] T031 Run initial Prisma migration to create database schema: prisma migrate dev --name init
- [ ] T032 Create seed script in backend/src/database/seeds/seed.ts for Super Admin and ProjectTypes
- [ ] T033 Start Docker Compose services and verify PostgreSQL and MinIO are healthy

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication and Access Control (Priority: P1) 🎯 MVP

**Goal**: Secure authentication with JWT, role-based access control (4 roles), user management by Super Admin

**Independent Test**: Create users with different roles, log in, verify role-based access enforcement

### Tests for User Story 1 (TDD - Write These FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T034 [P] [US1] Contract test for login mutation in backend/test/contract/auth.contract.spec.ts
- [ ] T035 [P] [US1] Contract test for refreshToken mutation in backend/test/contract/auth.contract.spec.ts
- [ ] T036 [P] [US1] Contract test for createUser mutation in backend/test/contract/users.contract.spec.ts
- [ ] T037 [P] [US1] Integration test for JWT auth flow in backend/test/integration/auth.integration.spec.ts
- [ ] T038 [P] [US1] Integration test for role-based access control in backend/test/integration/rbac.integration.spec.ts
- [ ] T039 [P] [US1] Unit test for AuthService in backend/test/unit/auth/auth.service.spec.ts
- [ ] T040 [P] [US1] Unit test for UsersService in backend/test/unit/users/users.service.spec.ts

### Implementation for User Story 1

- [ ] T041 [P] [US1] Create User entity with Prisma decorators in backend/prisma/schema.prisma (User model complete)
- [ ] T042 [P] [US1] Create RefreshToken entity in backend/prisma/schema.prisma
- [ ] T043 [US1] Run Prisma migration for User and RefreshToken: prisma migrate dev --name add_users
- [ ] T044 [P] [US1] Create User DTOs in backend/src/users/dto/ (CreateUserInput, UpdateUserInput, UserOutput)
- [ ] T045 [P] [US1] Create User GraphQL types in backend/src/users/entities/user.entity.ts with @ObjectType
- [ ] T046 [US1] Implement UsersService in backend/src/users/users.service.ts (CRUD operations, password hashing)
- [ ] T047 [US1] Implement UsersResolver in backend/src/users/users.resolver.ts (queries: users, user; mutations: createUser, updateUser)
- [ ] T048 [P] [US1] Create Auth DTOs in backend/src/auth/dto/ (LoginInput, AuthPayload)
- [ ] T049 [US1] Implement Passport Local Strategy in backend/src/auth/strategies/local.strategy.ts
- [ ] T050 [US1] Implement Passport JWT Strategy in backend/src/auth/strategies/jwt.strategy.ts
- [ ] T051 [US1] Implement AuthService in backend/src/auth/auth.service.ts (login, validateUser, generateTokens, refreshToken)
- [ ] T052 [US1] Implement AuthResolver in backend/src/auth/auth.resolver.ts (mutations: login, refreshToken, logout)
- [ ] T053 [US1] Implement RolesGuard in backend/src/auth/guards/roles.guard.ts with role checking logic
- [ ] T054 [P] [US1] Create login page in frontend/src/app/login/page.tsx with form and validation
- [ ] T055 [P] [US1] Create login GraphQL mutation in frontend/src/lib/graphql/mutations/auth.ts
- [ ] T056 [US1] Implement login form submission with Apollo Client mutation in frontend/src/app/login/page.tsx
- [ ] T057 [US1] Create auth context provider in frontend/src/lib/auth-context.tsx for storing auth state
- [ ] T058 [P] [US1] Create protected route wrapper in frontend/src/components/auth/ProtectedRoute.tsx
- [ ] T059 [US1] Implement Super Admin user management UI in frontend/src/app/admin/users/page.tsx
- [ ] T060 [P] [US1] Add logout functionality to header component in frontend/src/components/layout/Header.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Project and Organizational Structure (Priority: P1)

**Goal**: Create projects with groups and subjects, hierarchical navigation, project-level permissions

**Independent Test**: Create project, add groups and subjects, verify hierarchy displays and permissions work

### Tests for User Story 2 (TDD - Write These FIRST) ⚠️

- [ ] T061 [P] [US2] Contract test for createProject mutation in backend/test/contract/projects.contract.spec.ts
- [ ] T062 [P] [US2] Contract test for createProjectGroup mutation in backend/test/contract/projects.contract.spec.ts
- [ ] T063 [P] [US2] Contract test for createSubject mutation in backend/test/contract/projects.contract.spec.ts
- [ ] T064 [P] [US2] Integration test for project hierarchy in backend/test/integration/projects.integration.spec.ts
- [ ] T065 [P] [US2] Unit test for ProjectsService in backend/test/unit/projects/projects.service.spec.ts

### Implementation for User Story 2

- [ ] T066 [P] [US2] Create Project entity in backend/prisma/schema.prisma
- [ ] T067 [P] [US2] Create ProjectGroup entity in backend/prisma/schema.prisma
- [ ] T068 [P] [US2] Create Subject entity in backend/prisma/schema.prisma
- [ ] T069 [US2] Run Prisma migration: prisma migrate dev --name add_projects
- [ ] T070 [P] [US2] Create Project DTOs in backend/src/projects/dto/ (CreateProjectInput, UpdateProjectInput)
- [ ] T071 [P] [US2] Create Project GraphQL types in backend/src/projects/entities/project.entity.ts
- [ ] T072 [P] [US2] Create ProjectGroup DTOs in backend/src/projects/dto/ (CreateProjectGroupInput)
- [ ] T073 [P] [US2] Create Subject DTOs in backend/src/projects/dto/ (CreateSubjectInput)
- [ ] T074 [US2] Implement ProjectsService in backend/src/projects/projects.service.ts (CRUD for projects, groups, subjects)
- [ ] T075 [US2] Implement ProjectsResolver in backend/src/projects/projects.resolver.ts (queries and mutations)
- [ ] T076 [US2] Implement ProjectGroupsService in backend/src/projects/project-groups.service.ts
- [ ] T077 [US2] Implement SubjectsService in backend/src/projects/subjects.service.ts
- [ ] T078 [P] [US2] Create projects list page in frontend/src/app/projects/page.tsx
- [ ] T079 [P] [US2] Create GraphQL queries in frontend/src/lib/graphql/queries/projects.ts (projects, project)
- [ ] T080 [P] [US2] Create GraphQL mutations in frontend/src/lib/graphql/mutations/projects.ts
- [ ] T081 [US2] Implement project creation form in frontend/src/app/projects/new/page.tsx
- [ ] T082 [US2] Create project detail page in frontend/src/app/projects/[id]/page.tsx with hierarchy view
- [ ] T083 [US2] Implement group creation modal in frontend/src/components/projects/CreateGroupModal.tsx
- [ ] T084 [US2] Implement subject creation modal in frontend/src/components/projects/CreateSubjectModal.tsx
- [ ] T085 [US2] Create hierarchical navigation tree component in frontend/src/components/projects/ProjectTree.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Requirement Management with Versioning (Priority: P1)

**Goal**: Create, edit, version requirements with full history, support sub-requirements, status workflow

**Independent Test**: Create requirement, edit to create version 2, create sub-requirement, view version history

### Tests for User Story 3 (TDD - Write These FIRST) ⚠️

- [ ] T086 [P] [US3] Contract test for createRequirement mutation in backend/test/contract/requirements.contract.spec.ts
- [ ] T087 [P] [US3] Contract test for updateRequirement mutation in backend/test/contract/requirements.contract.spec.ts
- [ ] T088 [P] [US3] Integration test for requirement versioning in backend/test/integration/requirements.integration.spec.ts
- [ ] T089 [P] [US3] Integration test for requirement hierarchy in backend/test/integration/requirements.integration.spec.ts
- [ ] T090 [P] [US3] Unit test for RequirementsService in backend/test/unit/requirements/requirements.service.spec.ts
- [ ] T091 [P] [US3] Unit test for versioning logic in backend/test/unit/requirements/versioning.service.spec.ts

### Implementation for User Story 3

- [ ] T092 [P] [US3] Create Requirement entity in backend/prisma/schema.prisma with versioning relationships
- [ ] T093 [P] [US3] Create RequirementVersion entity in backend/prisma/schema.prisma
- [ ] T094 [US3] Run Prisma migration: prisma migrate dev --name add_requirements
- [ ] T095 [P] [US3] Create Requirement DTOs in backend/src/requirements/dto/ (CreateRequirementInput, UpdateRequirementInput)
- [ ] T096 [P] [US3] Create Requirement GraphQL types in backend/src/requirements/entities/requirement.entity.ts
- [ ] T097 [P] [US3] Create RequirementVersion GraphQL types in backend/src/requirements/entities/requirement-version.entity.ts
- [ ] T098 [US3] Implement VersioningService in backend/src/requirements/services/versioning.service.ts for version creation logic
- [ ] T099 [US3] Implement RequirementsService in backend/src/requirements/requirements.service.ts (CRUD with versioning)
- [ ] T100 [US3] Implement RequirementsResolver in backend/src/requirements/requirements.resolver.ts
- [ ] T101 [US3] Implement DataLoader for requirement versions in backend/src/requirements/loaders/requirement-version.loader.ts
- [ ] T102 [P] [US3] Create requirements list page in frontend/src/app/projects/[id]/requirements/page.tsx
- [ ] T103 [P] [US3] Create GraphQL queries in frontend/src/lib/graphql/queries/requirements.ts
- [ ] T104 [P] [US3] Create GraphQL mutations in frontend/src/lib/graphql/mutations/requirements.ts
- [ ] T105 [US3] Implement requirement editor component in frontend/src/components/requirements/RequirementEditor.tsx with Markdown support
- [ ] T106 [US3] Implement requirement detail page in frontend/src/app/requirements/[id]/page.tsx
- [ ] T107 [US3] Create version history sidebar in frontend/src/components/requirements/VersionHistory.tsx
- [ ] T108 [US3] Implement sub-requirement creation in frontend/src/components/requirements/CreateSubRequirement.tsx
- [ ] T109 [US3] Create requirement tree view component in frontend/src/components/requirements/RequirementTree.tsx
- [ ] T110 [US3] Implement status change workflow in frontend/src/components/requirements/StatusWorkflow.tsx

**Checkpoint**: MVP complete - Auth + Projects + Requirements with versioning fully functional

---

## Phase 6: User Story 4 - Solution and Task Management (Priority: P2)

**Goal**: Create solutions linked to requirements, break into tasks with versioning, show traceability

**Independent Test**: Create solution, link to requirements, add tasks, version task, verify traceability chain

### Tests for User Story 4 (TDD - Write These FIRST) ⚠️

- [ ] T111 [P] [US4] Contract test for createSolution mutation in backend/test/contract/solutions.contract.spec.ts
- [ ] T112 [P] [US4] Contract test for linkRequirementToSolution mutation in backend/test/contract/solutions.contract.spec.ts
- [ ] T113 [P] [US4] Contract test for createTask mutation in backend/test/contract/tasks.contract.spec.ts
- [ ] T114 [P] [US4] Integration test for requirement-solution traceability in backend/test/integration/traceability.integration.spec.ts
- [ ] T115 [P] [US4] Unit test for SolutionsService in backend/test/unit/solutions/solutions.service.spec.ts
- [ ] T116 [P] [US4] Unit test for TasksService in backend/test/unit/tasks/tasks.service.spec.ts

### Implementation for User Story 4

- [ ] T117 [P] [US4] Create Solution entity in backend/prisma/schema.prisma with versioning
- [ ] T118 [P] [US4] Create SolutionVersion entity in backend/prisma/schema.prisma
- [ ] T119 [P] [US4] Create Task entity in backend/prisma/schema.prisma with versioning
- [ ] T120 [P] [US4] Create TaskVersion entity in backend/prisma/schema.prisma
- [ ] T121 [P] [US4] Create RequirementSolutionLink entity in backend/prisma/schema.prisma
- [ ] T122 [US4] Run Prisma migration: prisma migrate dev --name add_solutions_tasks
- [ ] T123 [P] [US4] Create Solution DTOs in backend/src/solutions/dto/
- [ ] T124 [P] [US4] Create Task DTOs in backend/src/tasks/dto/
- [ ] T125 [P] [US4] Create Solution GraphQL types in backend/src/solutions/entities/solution.entity.ts
- [ ] T126 [P] [US4] Create Task GraphQL types in backend/src/tasks/entities/task.entity.ts
- [ ] T127 [US4] Implement SolutionsService in backend/src/solutions/solutions.service.ts with versioning
- [ ] T128 [US4] Implement SolutionsResolver in backend/src/solutions/solutions.resolver.ts
- [ ] T129 [US4] Implement TasksService in backend/src/tasks/tasks.service.ts with versioning
- [ ] T130 [US4] Implement TasksResolver in backend/src/tasks/tasks.resolver.ts
- [ ] T131 [US4] Implement RequirementSolutionLinkService in backend/src/solutions/services/requirement-solution-link.service.ts
- [ ] T132 [P] [US4] Create solutions list page in frontend/src/app/projects/[id]/solutions/page.tsx
- [ ] T133 [P] [US4] Create GraphQL queries in frontend/src/lib/graphql/queries/solutions.ts
- [ ] T134 [P] [US4] Create GraphQL mutations in frontend/src/lib/graphql/mutations/solutions.ts
- [ ] T135 [US4] Implement solution editor in frontend/src/components/solutions/SolutionEditor.tsx
- [ ] T136 [US4] Implement link requirements modal in frontend/src/components/solutions/LinkRequirementsModal.tsx
- [ ] T137 [US4] Create tasks board component in frontend/src/components/tasks/TasksBoard.tsx
- [ ] T138 [US4] Implement task creation form in frontend/src/components/tasks/CreateTaskForm.tsx
- [ ] T139 [US4] Create traceability view showing requirement→solution→task chain in frontend/src/components/traceability/TraceabilityView.tsx

**Checkpoint**: At this point, User Stories 1-4 are independently functional with full traceability

---

## Phase 7: User Story 5 - Development Iterations and Sprint Planning (Priority: P2)

**Goal**: Create iterations, assign tasks/requirements, track progress, show iteration board

**Independent Test**: Create iteration, add tasks, update statuses, verify progress calculation

### Tests for User Story 5 (TDD - Write These FIRST) ⚠️

- [ ] T140 [P] [US5] Contract test for createIteration mutation in backend/test/contract/iterations.contract.spec.ts
- [ ] T141 [P] [US5] Contract test for addItemToIteration mutation in backend/test/contract/iterations.contract.spec.ts
- [ ] T142 [P] [US5] Integration test for iteration planning in backend/test/integration/iterations.integration.spec.ts
- [ ] T143 [P] [US5] Unit test for IterationsService in backend/test/unit/iterations/iterations.service.spec.ts

### Implementation for User Story 5

- [ ] T144 [P] [US5] Create Iteration entity in backend/prisma/schema.prisma
- [ ] T145 [P] [US5] Create IterationItem entity in backend/prisma/schema.prisma
- [ ] T146 [US5] Run Prisma migration: prisma migrate dev --name add_iterations
- [ ] T147 [P] [US5] Create Iteration DTOs in backend/src/iterations/dto/
- [ ] T148 [P] [US5] Create Iteration GraphQL types in backend/src/iterations/entities/iteration.entity.ts
- [ ] T149 [US5] Implement IterationsService in backend/src/iterations/iterations.service.ts
- [ ] T150 [US5] Implement IterationsResolver in backend/src/iterations/iterations.resolver.ts
- [ ] T151 [P] [US5] Create iterations list page in frontend/src/app/projects/[id]/iterations/page.tsx
- [ ] T152 [P] [US5] Create GraphQL queries in frontend/src/lib/graphql/queries/iterations.ts
- [ ] T153 [P] [US5] Create GraphQL mutations in frontend/src/lib/graphql/mutations/iterations.ts
- [ ] T154 [US5] Implement iteration creation form in frontend/src/components/iterations/CreateIterationForm.tsx
- [ ] T155 [US5] Create iteration board view in frontend/src/app/iterations/[id]/page.tsx
- [ ] T156 [US5] Implement drag-and-drop task assignment in frontend/src/components/iterations/IterationBoard.tsx
- [ ] T157 [US5] Create progress calculation component in frontend/src/components/iterations/ProgressIndicator.tsx

**Checkpoint**: At this point, User Stories 1-5 enable complete agile workflow from requirements to sprint planning

---

## Phase 8: User Story 6 - Test Case Management and Traceability (Priority: P3)

**Goal**: Create test cases, link to requirements/solutions, record test runs, show coverage

**Independent Test**: Create test case, link to requirement, execute test run, verify coverage report

### Tests for User Story 6 (TDD - Write These FIRST) ⚠️

- [ ] T158 [P] [US6] Contract test for createTestCase mutation in backend/test/contract/tests.contract.spec.ts
- [ ] T159 [P] [US6] Contract test for recordTestRun mutation in backend/test/contract/tests.contract.spec.ts
- [ ] T160 [P] [US6] Integration test for test traceability in backend/test/integration/tests.integration.spec.ts
- [ ] T161 [P] [US6] Unit test for TestsService in backend/test/unit/tests/tests.service.spec.ts

### Implementation for User Story 6

- [ ] T162 [P] [US6] Create TestCase entity in backend/prisma/schema.prisma
- [ ] T163 [P] [US6] Create TestRun entity in backend/prisma/schema.prisma
- [ ] T164 [P] [US6] Create RequirementTestLink entity in backend/prisma/schema.prisma
- [ ] T165 [P] [US6] Create SolutionTestLink entity in backend/prisma/schema.prisma
- [ ] T166 [US6] Run Prisma migration: prisma migrate dev --name add_tests
- [ ] T167 [P] [US6] Create Test DTOs in backend/src/tests/dto/
- [ ] T168 [P] [US6] Create Test GraphQL types in backend/src/tests/entities/test-case.entity.ts
- [ ] T169 [US6] Implement TestsService in backend/src/tests/tests.service.ts
- [ ] T170 [US6] Implement TestsResolver in backend/src/tests/tests.resolver.ts
- [ ] T171 [P] [US6] Create test cases list page in frontend/src/app/projects/[id]/tests/page.tsx
- [ ] T172 [P] [US6] Create GraphQL queries in frontend/src/lib/graphql/queries/tests.ts
- [ ] T173 [P] [US6] Create GraphQL mutations in frontend/src/lib/graphql/mutations/tests.ts
- [ ] T174 [US6] Implement test case editor in frontend/src/components/tests/TestCaseEditor.tsx
- [ ] T175 [US6] Create test run recorder in frontend/src/components/tests/RecordTestRun.tsx
- [ ] T176 [US6] Implement test coverage report in frontend/src/components/tests/TestCoverageReport.tsx

**Checkpoint**: At this point, full test management and traceability is operational

---

## Phase 9: User Story 7 - File Attachments and Document Storage (Priority: P3)

**Goal**: Upload files to S3, attach to requirements/solutions/tasks/tests, download with presigned URLs

**Independent Test**: Upload file, attach to requirement, download file, verify secure storage

### Tests for User Story 7 (TDD - Write These FIRST) ⚠️

- [ ] T177 [P] [US7] Contract test for getUploadUrl mutation in backend/test/contract/files.contract.spec.ts
- [ ] T178 [P] [US7] Contract test for confirmUpload mutation in backend/test/contract/files.contract.spec.ts
- [ ] T179 [P] [US7] Integration test for S3 file upload in backend/test/integration/files.integration.spec.ts
- [ ] T180 [P] [US7] Unit test for FilesService in backend/test/unit/files/files.service.spec.ts

### Implementation for User Story 7

- [ ] T181 [P] [US7] Create Attachment entity in backend/prisma/schema.prisma
- [ ] T182 [US7] Run Prisma migration: prisma migrate dev --name add_attachments
- [ ] T183 [P] [US7] Create Attachment DTOs in backend/src/files/dto/
- [ ] T184 [P] [US7] Create Attachment GraphQL types in backend/src/files/entities/attachment.entity.ts
- [ ] T185 [US7] Implement S3Service in backend/src/files/services/s3.service.ts for presigned URLs
- [ ] T186 [US7] Implement FilesService in backend/src/files/files.service.ts
- [ ] T187 [US7] Implement FilesResolver in backend/src/files/files.resolver.ts
- [ ] T188 [P] [US7] Create file upload component in frontend/src/components/files/FileUpload.tsx with progress bar
- [ ] T189 [P] [US7] Create GraphQL mutations in frontend/src/lib/graphql/mutations/files.ts
- [ ] T190 [US7] Implement file upload logic with presigned URLs in frontend/src/components/files/FileUpload.tsx
- [ ] T191 [US7] Create attachments list component in frontend/src/components/files/AttachmentsList.tsx
- [ ] T192 [US7] Implement file download with presigned URLs in frontend/src/components/files/AttachmentsList.tsx

**Checkpoint**: File management fully operational across all entity types

---

## Phase 10: User Story 8 - Markdown Import and Export (Priority: P2)

**Goal**: Export requirements to Markdown with UIDs, import Markdown to create/update requirements

**Independent Test**: Export project to Markdown, edit file, re-import, verify new versions created

### Tests for User Story 8 (TDD - Write These FIRST) ⚠️

- [ ] T193 [P] [US8] Contract test for exportMarkdown mutation in backend/test/contract/import-export.contract.spec.ts
- [ ] T194 [P] [US8] Contract test for importMarkdown mutation in backend/test/contract/import-export.contract.spec.ts
- [ ] T195 [P] [US8] Integration test for Markdown round-trip in backend/test/integration/markdown.integration.spec.ts
- [ ] T196 [P] [US8] Unit test for MarkdownService in backend/test/unit/import-export/markdown.service.spec.ts

### Implementation for User Story 8

- [ ] T197 [P] [US8] Create ImportExportJob entity in backend/prisma/schema.prisma
- [ ] T198 [US8] Run Prisma migration: prisma migrate dev --name add_import_export_jobs
- [ ] T199 [P] [US8] Create ImportExportJob DTOs in backend/src/import-export/dto/
- [ ] T200 [P] [US8] Create ImportExportJob GraphQL types in backend/src/import-export/entities/import-export-job.entity.ts
- [ ] T201 [US8] Implement MarkdownService in backend/src/import-export/services/markdown.service.ts for parsing and generating
- [ ] T202 [US8] Implement ImportExportService in backend/src/import-export/import-export.service.ts
- [ ] T203 [US8] Implement ImportExportResolver in backend/src/import-export/import-export.resolver.ts
- [ ] T204 [P] [US8] Create import/export UI in frontend/src/app/projects/[id]/import-export/page.tsx
- [ ] T205 [P] [US8] Create GraphQL mutations in frontend/src/lib/graphql/mutations/import-export.ts
- [ ] T206 [US8] Implement export button with job status polling in frontend/src/components/import-export/ExportButton.tsx
- [ ] T207 [US8] Implement import form with file upload in frontend/src/components/import-export/ImportForm.tsx
- [ ] T208 [US8] Create job status monitor in frontend/src/components/import-export/JobStatusMonitor.tsx

**Checkpoint**: Markdown interoperability enables offline editing and version control integration

---

## Phase 11: User Story 9 - ReqIF Import and Export (Priority: P2)

**Goal**: Export to ReqIF XML with full metadata, import ReqIF from external tools, preserve hierarchy

**Independent Test**: Export to ReqIF, validate XML against spec, import into another tool, verify fidelity

### Tests for User Story 9 (TDD - Write These FIRST) ⚠️

- [ ] T209 [P] [US9] Contract test for exportReqIF mutation in backend/test/contract/import-export.contract.spec.ts
- [ ] T210 [P] [US9] Contract test for importReqIF mutation in backend/test/contract/import-export.contract.spec.ts
- [ ] T211 [P] [US9] Integration test for ReqIF round-trip in backend/test/integration/reqif.integration.spec.ts
- [ ] T212 [P] [US9] Unit test for ReqIFService in backend/test/unit/import-export/reqif.service.spec.ts

### Implementation for User Story 9

- [ ] T213 [US9] Implement ReqIFService in backend/src/import-export/services/reqif.service.ts for XML parsing and generation
- [ ] T214 [US9] Add ReqIF export method to ImportExportService in backend/src/import-export/import-export.service.ts
- [ ] T215 [US9] Add ReqIF import method to ImportExportService in backend/src/import-export/import-export.service.ts
- [ ] T216 [US9] Add ReqIF mutations to ImportExportResolver in backend/src/import-export/import-export.resolver.ts
- [ ] T217 [US9] Implement ReqIF export UI in frontend/src/components/import-export/ReqIFExport.tsx
- [ ] T218 [US9] Implement ReqIF import UI with mapping configuration in frontend/src/components/import-export/ReqIFImport.tsx

**Checkpoint**: Enterprise interoperability complete - can exchange with DOORS, Jama, etc.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T219 [P] Create comprehensive API documentation with GraphQL introspection in backend/docs/
- [ ] T220 [P] Add global search functionality across requirements in backend/src/search/search.service.ts
- [ ] T221 [P] Implement breadcrumb navigation component in frontend/src/components/layout/Breadcrumbs.tsx
- [ ] T222 [P] Add keyboard shortcuts for common operations in frontend/src/hooks/useKeyboardShortcuts.ts
- [ ] T223 [P] Create user profile page in frontend/src/app/profile/page.tsx
- [ ] T224 [P] Add dark mode toggle to settings in frontend/src/components/settings/ThemeToggle.tsx
- [ ] T225 [P] Implement notification system for background jobs in frontend/src/components/notifications/NotificationCenter.tsx
- [ ] T226 [P] Add data export to CSV functionality in backend/src/export/csv-export.service.ts
- [ ] T227 [P] Create system health dashboard for Super Admin in frontend/src/app/admin/health/page.tsx
- [ ] T228 [P] Add performance monitoring with Sentry in backend/src/main.ts and frontend/src/lib/sentry.ts
- [ ] T229 [P] Create E2E tests for P1 user stories in frontend/test/e2e/mvp.spec.ts
- [ ] T230 [P] Setup Storybook for component library in frontend/.storybook/
- [ ] T231 [P] Add bundle size analysis script in package.json scripts
- [ ] T232 Perform security audit with npm audit and address vulnerabilities
- [ ] T233 Run quickstart.md validation to ensure setup guide works
- [ ] T234 Create deployment guide in infra/README.md for cloud deployment
- [ ] T235 [P] Add database backup script in infra/scripts/backup-db.sh
- [ ] T236 [P] Create monitoring dashboards in Grafana (optional) for metrics

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Depends on User Story 2 (needs projects and subjects) - Should start after US2
- **User Story 4 (P2)**: Depends on User Story 3 (needs requirements) - Should start after US3
- **User Story 5 (P2)**: Depends on User Story 4 (needs tasks) - Should start after US4
- **User Story 6 (P3)**: Depends on User Stories 3 & 4 (needs requirements and solutions) - Can start after US4
- **User Story 7 (P3)**: No dependencies on other stories - Can start after Foundational
- **User Story 8 (P2)**: Depends on User Story 3 (needs requirements) - Can start after US3
- **User Story 9 (P2)**: Depends on User Story 3 (needs requirements) - Can start after US3

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Models before services
- Services before resolvers/endpoints
- Backend implementation before frontend
- Core implementation before UI polish
- Story complete and tested before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - US1 and US2 can start in parallel
  - US7 can start in parallel with US1/US2 (independent)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (respecting dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD - write these first):
Task T034: Contract test for login mutation
Task T035: Contract test for refreshToken mutation
Task T036: Contract test for createUser mutation
Task T037: Integration test for JWT auth flow
Task T038: Integration test for role-based access control
Task T039: Unit test for AuthService
Task T040: Unit test for UsersService

# After tests fail, launch all models for User Story 1 together:
Task T041: Create User entity in Prisma schema
Task T042: Create RefreshToken entity in Prisma schema

# After migration (T043), launch DTOs in parallel:
Task T044: Create User DTOs
Task T045: Create User GraphQL types
Task T048: Create Auth DTOs
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Projects)
5. Complete Phase 5: User Story 3 (Requirements with versioning)
6. **STOP and VALIDATE**: Test MVP independently
7. Deploy/demo if ready

**MVP Deliverable**: Secure authenticated system with project hierarchy and versioned requirements

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Authentication MVP)
3. Add User Story 2 → Test independently → Deploy/Demo (Add Projects)
4. Add User Story 3 → Test independently → Deploy/Demo (Full MVP with Requirements!)
5. Add User Story 4 → Test independently → Deploy/Demo (Add Solutions & Tasks)
6. Add User Story 5 → Test independently → Deploy/Demo (Add Sprint Planning)
7. Continue with P3 stories as needed
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: User Story 2 (Projects)
   - Developer C: User Story 7 (File Attachments - independent)
3. After US1 & US2 complete:
   - Developer A: User Story 3 (Requirements)
   - Developer B: User Story 4 (Solutions)
   - Developer C: User Story 8 (Markdown Import/Export)
4. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 236

**Tasks by Phase**:
- Phase 1 (Setup): 15 tasks
- Phase 2 (Foundational): 18 tasks
- Phase 3 (US1 - Authentication): 27 tasks (7 tests + 20 implementation)
- Phase 4 (US2 - Projects): 25 tasks (5 tests + 20 implementation)
- Phase 5 (US3 - Requirements): 25 tasks (6 tests + 19 implementation)
- Phase 6 (US4 - Solutions & Tasks): 29 tasks (6 tests + 23 implementation)
- Phase 7 (US5 - Iterations): 18 tasks (4 tests + 14 implementation)
- Phase 8 (US6 - Tests): 19 tasks (4 tests + 15 implementation)
- Phase 9 (US7 - Attachments): 16 tasks (4 tests + 12 implementation)
- Phase 10 (US8 - Markdown): 16 tasks (4 tests + 12 implementation)
- Phase 11 (US9 - ReqIF): 10 tasks (4 tests + 6 implementation)
- Phase 12 (Polish): 18 tasks

**MVP Scope (P1 Only)**: 85 tasks (Phases 1-5)
**Full P2 Scope**: 183 tasks (Phases 1-11)
**Complete Feature**: 236 tasks (All phases)

**Parallel Opportunities**: 127 tasks marked [P] can run in parallel within their phase

**Test Coverage**: 44 test tasks (TDD approach), covering contract, integration, and unit tests for all user stories

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail (RED) before implementing (GREEN), then refactor
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution requires TDD - all tests written first
- All file paths are absolute and specific
- Tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with path`
