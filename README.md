# Requirements Management System (A1 ReqMgmt)

A comprehensive, cloud-ready requirements management system built with modern web technologies, supporting full traceability from requirements through solutions to tasks and tests.

## Overview

This system provides:

- **Hierarchical Requirements Management**: Projects, groups, subjects, and nested requirements with full versioning
- **Solution & Task Tracking**: Link requirements to solutions and break them down into trackable tasks
- **Iteration Planning**: Organize work into development iterations/sprints
- **Test Management**: Define test cases and track test runs with requirement traceability
- **Import/Export**: ReqIF and Markdown format support for interoperability
- **File Attachments**: S3-backed storage for documents and artifacts
- **Multi-user Support**: Role-based access control (Super Admin, Project Admin, Contributor, Reviewer)

## Architecture

### Tech Stack

**Backend:**

- NestJS 10.x (TypeScript)
- GraphQL with Apollo Server
- PostgreSQL 15+ with Prisma ORM
- AWS SDK for S3 storage
- Passport.js for authentication

**Frontend:**

- Next.js 14.x with App Router
- React 18.x
- Apollo Client 3.x for GraphQL
- Shadcn/ui components
- Tailwind CSS

**Monorepo:**

- Turborepo for build orchestration
- pnpm workspaces
- Shared TypeScript types package

### Project Structure

```
a1ghreqmgmnt/
├── backend/              # NestJS GraphQL API
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── users/        # Users module
│   │   ├── projects/     # Projects module
│   │   ├── requirements/ # Requirements module
│   │   ├── solutions/    # Solutions module
│   │   ├── tasks/        # Tasks module
│   │   ├── tests/        # Tests module
│   │   ├── iterations/   # Iterations module
│   │   └── files/        # File management module
│   ├── prisma/           # Prisma schema and migrations
│   └── test/             # Tests
├── frontend/             # Next.js React app
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # GraphQL client, utilities
│   └── test/
├── shared/               # Shared TypeScript types
├── infra/                # Docker Compose, deployment configs
│   └── docker-compose.yml
└── specs/                # Feature specifications and plans
    └── 001-monorepo-setup/
        ├── spec.md       # Feature specification
        ├── plan.md       # Implementation plan
        ├── tasks.md      # Task breakdown
        ├── data-model.md # Database schema
        ├── quickstart.md # Quick start guide
        └── contracts/    # API contracts
```

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 8+
- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- Git

### Easy Setup with dev.sh Script (Recommended)

The project includes a comprehensive management script that handles Docker, infrastructure, and database setup:

```bash
# One-command complete setup (first time)
./dev.sh setup

# Start all services
./dev.sh start
```

That's it! The script will:

- Check and start Docker automatically
- Copy environment files
- Install dependencies
- Start infrastructure services (PostgreSQL + MinIO)
- Run database migrations and seeding
- Start development servers

**Common Commands:**

```bash
./dev.sh start          # Start all services
./dev.sh stop           # Stop all services
./dev.sh restart        # Restart all services
./dev.sh status         # Check service status
./dev.sh test           # Run tests
./dev.sh db-reset       # Reset database
./dev.sh help           # Show all commands
```

See the [Development Script](#development-script) section below for all available commands.

### Manual Setup (Alternative)

```bash
# Install dependencies
pnpm install

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start infrastructure (PostgreSQL + MinIO)
cd infra && docker-compose up -d

# Run database migrations
cd ../backend
pnpm prisma migrate dev --name init
pnpm prisma generate
pnpm prisma db seed

# Start all services
cd ..
pnpm dev
```

**Access Points:**

- Frontend: http://localhost:3000
- Backend GraphQL API: http://localhost:4000/graphql
- PostgreSQL: localhost:5432
- MinIO Console: http://localhost:9001

**Default Credentials:**

- Admin: admin@example.com / admin123
- MinIO: minioadmin / minioadmin

## Development

### Development Script

The `dev.sh` script provides a unified interface for managing the entire development environment. It automatically handles Docker, infrastructure services, database setup, and development servers.

#### Main Commands

```bash
./dev.sh setup          # Complete initial setup (run once)
./dev.sh start          # Start all services (infra + dev servers)
./dev.sh stop           # Stop all services
./dev.sh restart        # Restart all services
./dev.sh status         # Show status of all services
./dev.sh help           # Show all available commands
```

#### Infrastructure Commands

```bash
./dev.sh docker         # Check and start Docker if needed
./dev.sh infra-start   # Start infrastructure only (PostgreSQL, MinIO)
./dev.sh infra-stop    # Stop infrastructure services
./dev.sh infra-logs    # Show infrastructure logs in real-time
```

#### Database Commands

```bash
./dev.sh db-setup      # Run migrations and seed database
./dev.sh db-reset      # Reset database (WARNING: deletes all data!)
```

#### Development Commands

```bash
./dev.sh install       # Install/update dependencies
./dev.sh test          # Run all backend tests
./dev.sh dev           # Start dev servers only (without infra)
./dev.sh logs          # Show infrastructure logs
```

#### What the Script Does

When you run `./dev.sh setup`, it:

1. Checks if Docker is installed
2. Starts Docker Desktop automatically (macOS)
3. Copies `.env.example` files to `.env`
4. Installs all dependencies with pnpm
5. Starts PostgreSQL and MinIO containers
6. Waits for PostgreSQL to be ready
7. Runs Prisma migrations
8. Seeds the database with default Super Admin user
9. Displays URLs and default credentials

When you run `./dev.sh start`, it:

1. Ensures Docker is running
2. Starts infrastructure services
3. Starts both backend and frontend dev servers
4. Shows URLs where services are accessible

### Available pnpm Commands

```bash
# Development
pnpm dev                  # Start all services in dev mode
pnpm build                # Build all packages
pnpm clean                # Clean all build artifacts

# Testing
pnpm test                 # Run all tests
pnpm test:integration     # Run integration tests
pnpm test:e2e            # Run E2E tests

# Code Quality
pnpm lint                 # Lint all packages
pnpm lint:fix            # Fix linting issues
pnpm format              # Format code with Prettier
pnpm typecheck           # TypeScript type checking
```

### Database Operations

```bash
cd backend

# Create new migration
pnpm prisma migrate dev --name add_new_field

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# View database in Prisma Studio
pnpm prisma studio

# Generate TypeScript types from schema
pnpm prisma generate
```

## Documentation

- **[Specification](specs/001-monorepo-setup/spec.md)**: Complete feature specification with user stories
- **[Implementation Plan](specs/001-monorepo-setup/plan.md)**: Technical architecture and implementation details
- **[Data Model](specs/001-monorepo-setup/data-model.md)**: Database schema and entity relationships
- **[GraphQL Schema](specs/001-monorepo-setup/contracts/graphql-schema-core.graphql)**: API contract
- **[Constitution](.specify/memory/constitution.md)**: Project governance and quality standards
- **[Quick Start](specs/001-monorepo-setup/quickstart.md)**: Detailed setup and development guide

## Key Features

### Requirements Management

- Hierarchical structure: Project → Groups → Subjects → Requirements
- Main and sub-requirements with parent-child relationships
- Full version history for requirements
- Status workflow: Draft → Review → Approved
- Rich metadata: tags, priority, rationale

### Traceability

- Link requirements to solutions (SATISFIES, IMPLEMENTS, REFINES)
- Link requirements to test cases
- Track coverage across iterations
- Bidirectional navigation

### Import/Export

- **ReqIF**: Industry-standard requirements exchange format
- **Markdown**: Human-readable format for documentation
- Async job processing with status tracking
- S3-backed storage for all artifacts

### Collaboration

- Role-based access control
- Multi-user editing with version control
- Comment and review workflows
- Activity tracking

## Contributing

### Code Quality Standards

This project follows strict quality standards defined in the [constitution](.specify/memory/constitution.md):

- TypeScript strict mode enabled
- 80% backend test coverage required
- 70% frontend test coverage required
- TDD approach: tests written first
- Pre-commit hooks for linting and formatting

### Development Workflow

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass
5. Lint and format code
6. Create pull request

## Deployment

### Docker Build

```bash
# Build backend
docker build -f backend/Dockerfile --target production -t reqmgmt-backend .

# Build frontend
docker build -f frontend/Dockerfile --target production -t reqmgmt-frontend .
```

### Environment Variables

See `.env.example` files in root, backend, and frontend directories for all available configuration options.

## License

UNLICENSED - Private/Internal Use

## Support

For issues, questions, or contributions, please refer to the project documentation in the `specs/` directory.

---

**Built with**: NestJS • Next.js • PostgreSQL • GraphQL • TypeScript • Turborepo
