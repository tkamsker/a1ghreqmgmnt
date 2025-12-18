# Research: Monorepo Requirements Management System

**Date**: 2025-12-17
**Feature**: 001-monorepo-setup
**Purpose**: Resolve technical clarifications from Constitution Check and establish best practices

## Research Questions

1. **Monorepo Tooling**: Which tool provides the best balance of performance, developer experience, and ecosystem support?
2. **ORM Choice**: TypeORM vs Prisma for NestJS + PostgreSQL - which better supports versioned entities and complex relationships?
3. **APM Solution**: What monitoring tool best fits requirements for response time tracking, error reporting, and cost efficiency?

---

## 1. Monorepo Tooling Decision

### Decision: **Turborepo**

### Rationale

**Requirements**:

- Build caching to speed up repeated builds
- Parallel task execution for backend and frontend
- Simple configuration for TypeScript monorepo
- Support for Docker builds
- Good integration with pnpm or npm

**Options Evaluated**:

| Tool                | Pros                                                                                                                                                                  | Cons                                                                                             | Verdict                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------- |
| **Turborepo**       | - Fast incremental builds with remote caching<br>- Parallel execution with smart scheduling<br>- Simple JSON config<br>- Works with any package manager<br>- Great DX | - Less feature-rich than Nx<br>- No built-in code generators                                     | ✅ **RECOMMENDED**                    |
| **Nx**              | - Powerful code generation<br>- Deep framework integration<br>- Dependency graph visualization<br>- Module boundary enforcement                                       | - Steeper learning curve<br>- More configuration complexity<br>- Overkill for 2-package monorepo | ⚠️ Overkill for initial setup         |
| **pnpm workspaces** | - Simplest setup<br>- No additional dependencies<br>- Native pnpm support                                                                                             | - No build caching<br>- No parallel execution<br>- Manual script coordination                    | ❌ Insufficient for build performance |

**Decision Details**:

- **Turborepo** selected for optimal balance of performance and simplicity
- Configuration via `turbo.json` defining pipelines for `build`, `test`, `lint`, `dev`
- Cache can be local (initial) and later upgraded to remote cache (Vercel/self-hosted)
- Use **pnpm** as package manager for efficient disk usage and fast installs

**Implementation**:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false
    }
  }
}
```

**Package Manager**: pnpm 8.x with workspace protocol for internal dependencies

---

## 2. ORM Choice Decision

### Decision: **Prisma**

### Rationale

**Requirements**:

- Support for complex relationships (versioned entities, many-to-many links)
- Type-safe database access
- Migration management
- Good NestJS integration
- Performance for large datasets (10,000+ requirements)

**Options Evaluated**:

| Feature                   | TypeORM                                | Prisma                                      | Winner                |
| ------------------------- | -------------------------------------- | ------------------------------------------- | --------------------- |
| **Type Safety**           | Decorators, partial inference          | Full end-to-end type safety                 | ✅ Prisma             |
| **Migrations**            | Manual SQL or auto-generate            | Declarative schema → migrations             | ✅ Prisma             |
| **Query Performance**     | Raw SQL available, manual optimization | Query engine optimized, DataLoader built-in | 🟰 Tie                |
| **NestJS Integration**    | Official @nestjs/typeorm               | Community @nestjs/prisma                    | ✅ TypeORM (official) |
| **Complex Relationships** | Supports all patterns                  | Supports all patterns                       | 🟰 Tie                |
| **Learning Curve**        | Higher (Active Record/Repository)      | Lower (Prisma Client API)                   | ✅ Prisma             |
| **Ecosystem Maturity**    | Mature, widely used                    | Newer, rapidly growing                      | ✅ TypeORM            |

**Decision Details**:

- **Prisma** selected for superior type safety and developer experience
- Prisma schema defines all entities, relationships, and indexes in one place
- Migrations generated declaratively from schema changes (`prisma migrate dev`)
- NestJS integration via `@nestjs/prisma` package (community-maintained but stable)
- Prisma Client provides type-safe queries with autocompletion
- Built-in DataLoader-like batching for N+1 prevention

**Trade-offs Accepted**:

- Prisma is newer than TypeORM (less Stack Overflow content)
- Community NestJS package vs official (but @nestjs/prisma is well-maintained)
- Requires learning Prisma schema language (but simpler than decorators)

**Implementation**:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?
  loginType    LoginType
  userType     UserType
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdProjects     Project[]
  createdRequirements Requirement[]
  @@map("users")
}

model Requirement {
  id                String             @id @default(uuid())
  uid               String             // REQ-123
  projectId         String
  subjectId         String?
  parentRequirementId String?
  currentVersionId  String?
  status            RequirementStatus
  priority          Int?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  project          Project               @relation(fields: [projectId], references: [id])
  subject          Subject?              @relation(fields: [subjectId], references: [id])
  parentRequirement Requirement?         @relation("RequirementHierarchy", fields: [parentRequirementId], references: [id])
  subRequirements   Requirement[]        @relation("RequirementHierarchy")
  versions          RequirementVersion[]
  currentVersion    RequirementVersion?  @relation("CurrentVersion", fields: [currentVersionId], references: [id])
  solutionLinks     RequirementSolutionLink[]
  testLinks         RequirementTestLink[]

  @@unique([projectId, uid])
  @@index([projectId])
  @@index([status])
  @@index([createdAt])
  @@map("requirements")
}
```

**Best Practices**:

- Use Prisma transactions for versioning operations
- Implement soft delete with `deletedAt` field (not shown in example)
- Use `@@index` directives for frequently queried fields
- Generate GraphQL types from Prisma schema using `typegraphql-prisma`

---

## 3. APM Solution Decision

### Decision: **Sentry (with optional self-hosted Prometheus for infrastructure metrics)**

### Rationale

**Requirements**:

- Error tracking and alerting
- Performance monitoring (API response times, slow queries)
- Frontend error reporting
- Budget-friendly for startup/small team
- Easy integration with NestJS and Next.js

**Options Evaluated**:

| Solution                 | Error Tracking | Performance Monitoring | Cost                                      | Setup Complexity        | Verdict                   |
| ------------------------ | -------------- | ---------------------- | ----------------------------------------- | ----------------------- | ------------------------- |
| **Sentry**               | ⭐⭐⭐⭐⭐     | ⭐⭐⭐⭐               | Free tier: 5K errors/mo<br>$26/mo for 50K | Low (SDK install)       | ✅ **RECOMMENDED**        |
| **New Relic**            | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐             | $0 for <100GB/mo<br>Can get expensive     | Medium (agent install)  | ⚠️ Overkill initially     |
| **Datadog**              | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐             | $15/host/mo minimum<br>Expensive at scale | Medium                  | ❌ Too expensive          |
| **Prometheus + Grafana** | ⭐             | ⭐⭐⭐⭐               | Free (self-hosted)                        | High (full stack setup) | ⚠️ DIY, no error tracking |

**Decision Details**:

- **Sentry** for error tracking and performance monitoring (backend + frontend)
- **Prometheus + Grafana** (optional) for infrastructure metrics (PostgreSQL, CPU, memory) if needed later
- Sentry free tier (5,000 errors/month) sufficient for MVP
- Sentry's Performance Monitoring tracks GraphQL operation times and database queries
- Sentry's Release Tracking enables associating errors with deployments

**Implementation**:

**Backend (NestJS)**:

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions for performance
});

// Sentry intercept or for GraphQL
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        Sentry.captureException(error);
        throw error;
      }),
    );
  }
}
```

**Frontend (Next.js)**:

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Capture replay on error
});
```

**Best Practices**:

- Set up Sentry Releases to track which code version caused errors
- Use custom Sentry tags (userId, projectId, operationType) for filtering
- Configure alert rules for critical errors (e.g., authentication failures, database connection errors)
- Use Sentry Performance to identify slow GraphQL resolvers and N+1 query problems

---

## 4. Additional Best Practices Research

### GraphQL Best Practices for NestJS

**Schema Design**:

- Use Code-First approach with `@nestjs/graphql` decorators
- Define clear separation: DTOs for input, Entities for output
- Use DataLoader for batch loading to prevent N+1 queries
- Implement pagination with `Connection` pattern (Relay spec)

**Example**:

```typescript
// requirements.resolver.ts
@Resolver(() => Requirement)
export class RequirementsResolver {
  constructor(
    private requirementsService: RequirementsService,
    private versionLoader: DataLoader<string, RequirementVersion>,
  ) {}

  @Query(() => [Requirement])
  async requirements(
    @Args('projectId') projectId: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ): Promise<Requirement[]> {
    return this.requirementsService.findAll({ projectId, first, after });
  }

  @ResolveField(() => RequirementVersion)
  async currentVersion(@Parent() requirement: Requirement) {
    return this.versionLoader.load(requirement.currentVersionId);
  }
}
```

### Authentication & Authorization Best Practices

**Strategy**:

- Use Passport Local Strategy for email/password login
- Use Passport JWT Strategy for API authentication
- Implement refresh tokens (30-day expiry) stored in database with access tokens (24-hour expiry)
- Add custom GraphQL guards for role-based access control

**Example**:

```typescript
@Roles(UserType.PROJECT_ADMIN, UserType.SUPER_ADMIN)
@UseGuards(GqlAuthGuard, RolesGuard)
@Mutation(() => Project)
async createProject(@Args('input') input: CreateProjectInput, @CurrentUser() user: User) {
  return this.projectsService.create(input, user);
}
```

### File Upload Best Practices (S3)

**Strategy**:

- Use presigned URLs for direct client → S3 uploads (avoids backend proxy)
- Backend generates presigned POST URL with policy (size limit, file type)
- Client uploads directly to S3 with progress indication
- Client notifies backend when upload completes to create Attachment record

**Flow**:

1. Client requests upload URL: `mutation getUploadUrl($filename, $contentType)`
2. Backend generates presigned URL valid for 15 minutes
3. Client uploads file directly to S3 using presigned URL
4. Client calls `mutation confirmUpload($s3Key, $metadata)` to persist attachment record

### Testing Best Practices

**Unit Tests**:

- Mock Prisma Client using `jest.mock` or create mock Prisma instance
- Test services in isolation with mocked dependencies
- Test GraphQL resolvers with mocked services

**Integration Tests**:

- Use test database (separate from dev database)
- Wrap tests in transactions and rollback after each test
- Seed necessary data (users, projects) in `beforeEach`

**E2E Tests**:

- Use Playwright or Cypress for frontend E2E
- Test critical user journeys (P1 user stories)
- Run against docker-compose test environment

**Contract Tests**:

- Validate GraphQL schema doesn't break backward compatibility
- Use `graphql-schema-linter` for schema validation rules
- Snapshot test GraphQL responses for regression detection

---

## 5. Docker Compose Configuration Research

### Local Development Environment

**Services Required**:

- PostgreSQL 15 (primary database)
- MinIO (S3-compatible object storage)
- Backend API (NestJS)
- Frontend (Next.js)

**Example docker-compose.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: rms-postgres
    environment:
      POSTGRES_USER: rms_user
      POSTGRES_PASSWORD: rms_password
      POSTGRES_DB: rms_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rms_user']
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: rms-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
      target: development
    container_name: rms-backend
    environment:
      DATABASE_URL: postgresql://rms_user:rms_password@postgres:5432/rms_db
      AWS_ACCESS_KEY_ID: minioadmin
      AWS_SECRET_ACCESS_KEY: minioadmin
      AWS_ENDPOINT: http://minio:9000
      AWS_REGION: us-east-1
      S3_BUCKET: rms-attachments
      JWT_SECRET: dev-secret-change-in-production
      NODE_ENV: development
    ports:
      - '4000:4000'
    volumes:
      - ./backend:/app/backend
      - /app/backend/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    command: npm run start:dev

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      target: development
    container_name: rms-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/graphql
      NEXT_PUBLIC_SENTRY_DSN: ${NEXT_PUBLIC_SENTRY_DSN}
      NODE_ENV: development
    ports:
      - '3000:3000'
    volumes:
      - ./frontend:/app/frontend
      - /app/frontend/node_modules
      - /app/frontend/.next
    depends_on:
      - backend
    command: npm run dev

volumes:
  postgres_data:
  minio_data:
```

**Usage**:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend npm run prisma:migrate:dev

# Seed data
docker-compose exec backend npm run prisma:seed

# Stop all services
docker-compose down

# Reset database
docker-compose down -v  # removes volumes
docker-compose up -d
```

---

## Summary of Decisions

| Decision Area         | Choice               | Key Benefit                                       |
| --------------------- | -------------------- | ------------------------------------------------- |
| **Monorepo Tool**     | Turborepo + pnpm     | Fast incremental builds with caching              |
| **ORM**               | Prisma               | End-to-end type safety, better DX                 |
| **APM**               | Sentry               | Best error tracking, affordable, easy integration |
| **Package Manager**   | pnpm 8.x             | Efficient disk usage, fast installs               |
| **Auth Strategy**     | JWT + Refresh Tokens | Stateless, scalable, mobile-friendly              |
| **File Upload**       | S3 Presigned URLs    | Offload bandwidth from backend                    |
| **Testing Framework** | Jest + Playwright    | Comprehensive coverage from unit to E2E           |

All decisions align with constitution principles:

- ✅ Code Quality: TypeScript strict mode, Prisma type safety
- ✅ Testing: Comprehensive test strategy across all layers
- ✅ Performance: DataLoader, indexes, caching with Turborepo
- ✅ Maintainability: Clear separation of concerns, migrations, monitoring

**Next Steps**: Proceed to Phase 1 (Design & Contracts) to define data model and GraphQL schema based on these research findings.
