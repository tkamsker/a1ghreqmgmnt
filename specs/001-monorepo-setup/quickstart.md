# Quickstart: Requirements Management System

**Date**: 2025-12-17
**Feature**: 001-monorepo-setup
**Purpose**: Get the development environment running quickly

## Prerequisites

- Node.js 20+ and pnpm 8+
- Docker Desktop (macOS/Windows) or Docker Engine (Linux)
- Git

## Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd a1ghreqmgmnt

# Install dependencies (monorepo root)
pnpm install

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start infrastructure (PostgreSQL + MinIO)
docker-compose up -d postgres minio

# Wait for services to be healthy (check logs)
docker-compose logs -f postgres

# Run database migrations
cd backend
pnpm prisma migrate dev

# Seed development data
pnpm prisma db seed

# Generate Prisma Client
pnpm prisma generate

# Return to root
cd ..
```

## Development Workflow

### Start All Services

```bash
# Option 1: Using Turborepo (recommended)
pnpm dev

# Option 2: Individual services
pnpm --filter backend dev  # Backend on :4000
pnpm --filter frontend dev # Frontend on :3000
```

### Access Points

- Frontend: http://localhost:3000
- Backend GraphQL API: http://localhost:4000/graphql
- GraphQL Playground: http://localhost:4000/graphql
- PostgreSQL: localhost:5432
- MinIO Console: http://localhost:9001

### Default Credentials

**Super Admin (seeded)**:

- Email: `admin@example.com`
- Password: `admin123` (change immediately in production)

**MinIO**:

- Access Key: `minioadmin`
- Secret Key: `minioadmin`

## Common Tasks

### Database Operations

```bash
cd backend

# Create new migration
pnpm prisma migrate dev --name add_new_field

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# View database in Prisma Studio
pnpm prisma studio  # Opens at http://localhost:5555

# Generate TypeScript types from schema
pnpm prisma generate
```

### Testing

```bash
# Run all tests
pnpm test

# Backend unit tests
pnpm --filter backend test

# Backend integration tests
pnpm --filter backend test:integration

# Backend E2E tests
pnpm --filter backend test:e2e

# Frontend unit tests
pnpm --filter frontend test

# Frontend E2E tests (Playwright)
pnpm --filter frontend test:e2e
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter backend build
pnpm --filter frontend build
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Prisma Client Out of Sync

```bash
cd backend
pnpm prisma generate
```

### Clear Node Modules and Reinstall

```bash
# Remove all node_modules
rm -rf node_modules backend/node_modules frontend/node_modules

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

## Project Structure Quick Reference

```
a1ghreqmgmnt/
├── backend/          # NestJS GraphQL API
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── users/    # Users module
│   │   ├── projects/ # Projects module
│   │   ├── requirements/ # Requirements module
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── test/
├── frontend/         # Next.js React app
│   ├── src/
│   │   ├── app/      # Next.js App Router pages
│   │   ├── components/ # React components
│   │   └── lib/      # GraphQL client, utilities
│   └── test/
├── shared/           # Shared types and utilities
├── infra/            # Docker Compose, deployment configs
└── specs/            # Feature specifications and plans
```

## Next Steps

1. ✅ Environment running
2. ✅ Database seeded with sample data
3. ✅ Login as Super Admin
4. Create a project
5. Add requirements
6. Link solutions and tasks
7. Plan an iteration

## Development Tips

- Use Prisma Studio for visual database inspection
- GraphQL Playground for API testing
- Check constitution.md for code quality standards
- Run tests before committing
- Use pre-commit hooks (installed automatically)

## Need Help?

- Check README.md for detailed documentation
- Review specs/001-monorepo-setup/plan.md for architecture details
- Consult data-model.md for database schema
- Check contracts/ for GraphQL schema definitions
