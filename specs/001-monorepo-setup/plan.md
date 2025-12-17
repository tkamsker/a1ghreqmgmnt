# Implementation Plan: Monorepo Requirements Management System

**Branch**: `001-monorepo-setup` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-monorepo-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a cloud-native requirements management system supporting hierarchical projects, versioned requirements with traceability to solutions and tasks, development iteration planning, test management, and enterprise interoperability via ReqIF/Markdown import/export. The system will use a monorepo structure with a GraphQL API backend and web frontend, architected for future mobile client support.

## Technical Context

**Language/Version**: TypeScript 5.3+
**Primary Dependencies**:
- Backend: NestJS 10.x, Apollo Server (GraphQL), TypeORM or Prisma (ORM), Passport.js (Auth), AWS SDK (S3)
- Frontend: Next.js 14.x (App Router), React 18.x, Apollo Client 3.x, TanStack Query (optional for REST fallbacks)
- Shared: GraphQL Code Generator, class-validator, class-transformer

**Storage**: PostgreSQL 15+ (primary data), S3-compatible object storage (attachments, ReqIF/MD files)

**Testing**:
- Backend: Jest (unit), Supertest (integration), Pact (contract)
- Frontend: Jest + React Testing Library (unit/integration), Playwright or Cypress (E2E)
- Shared: GraphQL schema testing, API contract validation

**Target Platform**:
- Development: Docker Compose (macOS, Linux, Windows via WSL2)
- Production: Containerized cloud (AWS ECS, Kubernetes, or similar)
- Clients: Modern browsers (Chrome, Firefox, Safari, Edge last 2 versions), future mobile (iOS 15+, Android 12+)

**Project Type**: Monorepo web application with backend + frontend packages

**Performance Goals**:
- API: <100ms p95 for simple queries, <500ms p95 for complex queries with joins/aggregations, <300ms p95 for mutations
- Frontend: <3s Time to Interactive on 3G, <200ms route transitions
- Throughput: 500 concurrent users, 1000 requirements/min for ReqIF import/export

**Constraints**:
- Database connection limit: 20 max connections (pooling required)
- File upload size: 50MB max per attachment
- ReqIF/Markdown exports must stream for large projects (>1000 requirements)
- JWT token expiry: 24 hours (refresh token: 30 days)
- Monorepo tooling: NEEDS CLARIFICATION (Nx, Turborepo, or npm/pnpm workspaces)

**Scale/Scope**:
- Users: 500 concurrent, 5,000 total registered users per deployment
- Data: 100 projects, 10,000 requirements per project, 50,000 total requirements per deployment
- Versions: Average 5 versions per requirement, 250,000 total requirement versions
- Attachments: 100,000 files, 500GB total storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Code Quality Standards

**Status**: COMPLIANT

- TypeScript strict mode will be enabled in all `tsconfig.json` files
- ESLint + Prettier configured with pre-commit hooks (husky + lint-staged)
- GitHub branch protection requires 1 approving review before merge
- JSDoc comments required for all exported functions and GraphQL resolvers
- Security: Parameterized queries (via ORM), Content Security Policy headers, secrets in environment variables only
- Dependency scanning via `npm audit` or Snyk in CI pipeline

**Actions**:
- Configure ESLint rulesets: `@typescript-eslint/recommended`, `plugin:@next/next/recommended`, `plugin:prettier/recommended`
- Setup pre-commit hooks to block commits with linting errors
- Add JSDoc linting rules to enforce documentation coverage

### ✅ II. Testing Standards

**Status**: COMPLIANT

- TDD workflow enforced: tests written first, RED → GREEN → REFACTOR
- Coverage targets: Backend 80%, Frontend 70%
- Test categories: Unit (Jest), Integration (Supertest + Test DB), Contract (Pact or GraphQL schema tests), E2E (Playwright)
- CI runs all tests on every PR; merge blocked if tests fail
- Test data: Database transactions with rollback in tests; seed data in `backend/src/database/seeds/`

**Actions**:
- Setup Jest with coverage thresholds in `jest.config.js`
- Configure test database (Postgres in Docker for local dev, ephemeral DB in CI)
- Implement GraphQL contract tests using `graphql-schema-linter` and schema snapshots
- Add E2E test suite for P1 user stories (authentication, project creation, requirement CRUD)

### ✅ III. User Experience Consistency

**Status**: COMPLIANT

- Design system: Shadcn/ui component library (Radix UI primitives + Tailwind CSS)
- Accessibility: WCAG 2.1 AA compliance; keyboard navigation, ARIA labels, contrast validation via axe-core
- Responsive: Mobile-first design; breakpoints at 768px (tablet), 1366px (laptop), 1920px (desktop)
- Loading states: Skeleton loaders for data fetching, progress bars for file uploads
- Error handling: React Error Boundary for uncaught errors, inline validation errors, toast notifications (react-hot-toast)
- Consistency: Shared layout components, consistent terminology ("Requirement" not "Req"), style guide document

**Actions**:
- Install and configure Shadcn/ui components
- Add axe-core accessibility testing to E2E suite
- Create shared layout components (Header, Sidebar, Breadcrumbs)
- Document component usage patterns in Storybook (optional for v1)

### ✅ IV. Performance Requirements

**Status**: COMPLIANT

- API response times meet thresholds (see Technical Context)
- Database: Indexes on `project_id`, `uid`, `status`, `created_at`, `tags`; DataLoader pattern for N+1 prevention
- Frontend: Code splitting by route (Next.js automatic), lazy loading for modals/dialogs, bundle size monitoring
- Monitoring: NEEDS CLARIFICATION (Options: Sentry, New Relic, Datadog, or self-hosted Prometheus + Grafana)

**Actions**:
- Add database indexes in initial migration
- Implement DataLoader in GraphQL resolvers for batch loading
- Setup Next.js bundle analyzer to track bundle size
- Configure APM tool for response time and error tracking (decision needed)

### ⚠️ V. Maintainability & Technical Excellence

**Status**: REQUIRES CLARIFICATION

- Separation of concerns: Backend (Resolvers → Services → Repositories), Frontend (Components → Hooks → GraphQL queries)
- DRY: Shared code in `shared/` package or monorepo utilities
- Migrations: TypeORM migrations (if TypeORM) or Prisma migrations (if Prisma) - NEEDS CLARIFICATION
- Versioning: Semantic versioning for API; GraphQL schema evolution via deprecation fields
- Environment parity: Docker Compose for local, containers in cloud, `.env.example` committed
- Logging: Winston (backend) or Pino for structured JSON logs; frontend errors logged via APM
- Technical debt: 20% sprint allocation, tracked in GitHub Issues with `tech-debt` label

**Actions**:
- Decide on ORM: TypeORM (more SQL control) vs Prisma (better DX, type safety) - NEEDS RESEARCH
- Setup Winston with log levels (ERROR, WARN, INFO, DEBUG) and context enrichment
- Create `.env.example` with all required environment variables documented
- Add tech debt review to sprint planning process

### Summary

**Overall Status**: ✅ COMPLIANT (with 2 clarifications needed)

**Violations**: None

**Clarifications Required**:
1. Monorepo tooling choice (Nx, Turborepo, npm workspaces) - impacts build performance and DX
2. ORM choice (TypeORM vs Prisma) - impacts migration strategy and type safety
3. APM tool choice (Sentry, New Relic, Datadog, Prometheus+Grafana) - impacts monitoring capabilities and cost

**Gate Decision**: ✅ **PROCEED TO PHASE 0** - Clarifications will be resolved during research phase

## Project Structure

### Documentation (this feature)

```text
specs/001-monorepo-setup/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output (pending)
├── data-model.md        # Phase 1 output (pending)
├── quickstart.md        # Phase 1 output (pending)
├── contracts/           # Phase 1 output (pending)
│   ├── graphql-schema.graphql
│   └── mutations-queries.md
├── checklists/
│   └── requirements.md  # Quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
a1ghreqmgmnt/                    # Repository root (monorepo)
├── backend/                      # NestJS GraphQL API
│   ├── src/
│   │   ├── main.ts              # Application entry point
│   │   ├── app.module.ts        # Root module
│   │   ├── auth/                # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.resolver.ts
│   │   │   ├── strategies/      # Passport strategies (JWT, local)
│   │   │   └── guards/          # Auth guards
│   │   ├── users/               # Users module
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.resolver.ts
│   │   │   ├── entities/user.entity.ts
│   │   │   └── dto/             # Data transfer objects
│   │   ├── projects/            # Projects module
│   │   │   ├── projects.module.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.resolver.ts
│   │   │   ├── entities/        # Project, ProjectGroup, Subject entities
│   │   │   └── dto/
│   │   ├── requirements/        # Requirements module
│   │   │   ├── requirements.module.ts
│   │   │   ├── requirements.service.ts
│   │   │   ├── requirements.resolver.ts
│   │   │   ├── entities/        # Requirement, RequirementVersion entities
│   │   │   └── dto/
│   │   ├── solutions/           # Solutions module
│   │   ├── tasks/               # Tasks module
│   │   ├── iterations/          # Iterations module
│   │   ├── tests/               # Test cases module
│   │   ├── files/               # File attachments module (S3 integration)
│   │   ├── import-export/       # ReqIF/Markdown import/export module
│   │   ├── database/
│   │   │   ├── migrations/      # TypeORM or Prisma migrations
│   │   │   └── seeds/           # Test data seeds
│   │   ├── common/
│   │   │   ├── decorators/      # Custom decorators
│   │   │   ├── filters/         # Exception filters
│   │   │   ├── interceptors/    # Logging, transformation interceptors
│   │   │   └── pipes/           # Validation pipes
│   │   └── config/              # Configuration module
│   ├── test/
│   │   ├── unit/                # Unit tests
│   │   ├── integration/         # Integration tests (with test DB)
│   │   ├── contract/            # GraphQL contract tests
│   │   └── e2e/                 # End-to-end tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                     # Next.js React application
│   ├── src/
│   │   ├── app/                 # Next.js 14 App Router
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── login/           # Auth pages
│   │   │   ├── projects/        # Projects pages
│   │   │   │   └── [id]/        # Dynamic project pages
│   │   │   ├── requirements/    # Requirements pages
│   │   │   ├── solutions/       # Solutions pages
│   │   │   ├── tasks/           # Tasks pages
│   │   │   └── iterations/      # Iterations pages
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn/ui components
│   │   │   ├── layout/          # Header, Sidebar, Footer
│   │   │   ├── projects/        # Project-specific components
│   │   │   ├── requirements/    # Requirement editor, tree view
│   │   │   └── shared/          # Shared utilities components
│   │   ├── lib/
│   │   │   ├── apollo-client.ts # Apollo Client configuration
│   │   │   ├── graphql/         # GraphQL queries, mutations, fragments
│   │   │   └── utils/           # Utility functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   └── styles/              # Global styles, Tailwind config
│   ├── public/                  # Static assets
│   ├── test/
│   │   ├── unit/                # Component unit tests
│   │   ├── integration/         # Integration tests
│   │   └── e2e/                 # Playwright E2E tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── jest.config.js
│   ├── playwright.config.ts
│   ├── .env.example
│   └── Dockerfile
│
├── shared/                       # Shared code between backend and frontend
│   ├── types/                   # Shared TypeScript types
│   ├── constants/               # Shared constants
│   └── utils/                   # Shared utility functions
│
├── infra/                        # Infrastructure and deployment
│   ├── docker-compose.yml       # Local development environment
│   ├── docker-compose.prod.yml  # Production-like local environment
│   ├── postgres/                # Postgres configuration
│   │   └── init.sql             # Initial DB setup
│   ├── minio/                   # MinIO (S3) configuration for local dev
│   └── kubernetes/              # Kubernetes manifests (optional)
│       ├── backend-deployment.yaml
│       ├── frontend-deployment.yaml
│       ├── postgres-statefulset.yaml
│       └── ingress.yaml
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│       ├── backend-ci.yml       # Backend tests and build
│       ├── frontend-ci.yml      # Frontend tests and build
│       └── deploy.yml           # Deployment workflow
│
├── .husky/                      # Git hooks (pre-commit, pre-push)
├── package.json                 # Root monorepo package.json
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── turbo.json                   # Turborepo configuration (if using Turborepo)
├── .eslintrc.js                 # Root ESLint config
├── .prettierrc                  # Prettier config
├── tsconfig.base.json           # Base TypeScript config for monorepo
├── README.md                    # Project overview
└── .env.example                 # Root environment variables example
```

**Structure Decision**: Monorepo with backend and frontend as separate packages, communicating via GraphQL API. This structure:
- Enables independent development and deployment of backend and frontend
- Facilitates code sharing via `shared/` package for types and utilities
- Supports future mobile clients consuming the same GraphQL API
- Allows parallel development by different team members on backend vs frontend
- Uses Docker Compose for local development with PostgreSQL and MinIO (S3-compatible storage)

**Monorepo Tooling**: To be decided in Phase 0 research (Turborepo recommended for caching and parallel execution, or pnpm workspaces for simplicity)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified.** All architecture decisions comply with constitution principles.

---

## Phase Summary

### ✅ Phase 0: Research (Completed)

**Artifacts Generated**:
- `research.md`: Technical decisions documented

**Key Decisions Made**:
1. **Monorepo Tool**: Turborepo with pnpm for fast incremental builds
2. **ORM**: Prisma for end-to-end type safety and better developer experience
3. **APM**: Sentry for error tracking and performance monitoring
4. **Package Manager**: pnpm 8.x for efficient disk usage
5. **Auth Strategy**: JWT with refresh tokens for stateless authentication
6. **File Upload**: S3 presigned URLs for direct client uploads

**All NEEDS CLARIFICATION items resolved.**

### ✅ Phase 1: Design & Contracts (Completed)

**Artifacts Generated**:
- `data-model.md`: Complete Prisma schema with 20+ entities, relationships, indexes
- `contracts/graphql-schema-core.graphql`: GraphQL type definitions, queries, mutations
- `quickstart.md`: Developer onboarding and common workflows
- `CLAUDE.md`: Updated agent context with TypeScript 5.3+ and PostgreSQL 15+

**Design Highlights**:
- **Versioning Pattern**: Immutable version records for requirements, solutions, tasks
- **Traceability**: Explicit link tables for requirements→solutions→tasks→tests
- **Performance**: Strategic indexes on project_id, status, createdAt, uid
- **Scalability**: Support for 500 concurrent users, 50K requirements, 10K per project

**GraphQL Schema**:
- 20+ types covering authentication, projects, requirements, solutions, tasks, iterations, tests
- Relay-style pagination with Connection types
- Presigned S3 URLs for file uploads/downloads
- Versioning APIs for creating new versions on edits

### Constitution Re-Check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| Code Quality | ✅ PASS | TypeScript strict mode, Prisma type safety, ESLint+Prettier |
| Testing | ✅ PASS | Jest, Supertest, Playwright, contract tests planned |
| UX Consistency | ✅ PASS | Shadcn/ui design system, WCAG 2.1 AA, responsive design |
| Performance | ✅ PASS | DataLoader pattern, indexed queries, bundle optimization |
| Maintainability | ✅ PASS | Clean architecture (resolvers → services → repos), migrations, monitoring |

**Overall**: All constitution gates passed. Architecture is sound and ready for implementation.

---

## Next Steps

### Immediate (Ready to Start)

1. **Run** `/speckit.tasks` to generate tasks.md breaking down user stories into concrete implementation tasks
2. **Initialize** monorepo structure:
   ```bash
   mkdir -p backend frontend shared infra
   pnpm init
   pnpm add -D turbo
   ```
3. **Setup** Prisma schema from data-model.md
4. **Configure** Docker Compose from quickstart.md examples

### Implementation Phases (After Tasks Generated)

**Phase 1: Foundation (P1 User Stories)**
- Setup: Monorepo, linting, testing, Docker Compose
- User Authentication (User Story 1)
- Project Structure (User Story 2)
- Requirement Management (User Story 3)
- **Deliverable**: MVP with auth + projects + requirements

**Phase 2: Enhanced Capabilities (P2 User Stories)**
- Solutions and Tasks (User Story 4)
- Iterations (User Story 5)
- Markdown Import/Export (User Story 8)
- ReqIF Import/Export (User Story 9)
- **Deliverable**: Full traceability and enterprise interoperability

**Phase 3: Additional Features (P3 User Stories)**
- Test Management (User Story 6)
- File Attachments (User Story 7)
- **Deliverable**: Complete requirements management platform

### Development Order

1. Backend first (API + database)
2. Frontend incrementally as backend endpoints become available
3. E2E tests for each completed user story
4. Documentation updates as features are completed

---

## Planning Complete

**Status**: ✅ **READY FOR IMPLEMENTATION**

**Generated Artifacts**:
- ✅ `spec.md` - Feature specification with 9 user stories
- ✅ `plan.md` - This implementation plan (you are here)
- ✅ `research.md` - Technical decisions and best practices
- ✅ `data-model.md` - Complete database schema with Prisma
- ✅ `contracts/graphql-schema-core.graphql` - GraphQL API contract
- ✅ `quickstart.md` - Development environment setup guide
- ✅ `checklists/requirements.md` - Specification quality validation
- ✅ `CLAUDE.md` - Updated agent context

**Next Command**: `/speckit.tasks` to generate task breakdown

**Branch**: `001-monorepo-setup` (active)
**Spec Directory**: `/specs/001-monorepo-setup/`
