# Quick Start Guide - Multi-Terminal Development

This guide will help you start developing with the new multi-terminal workflow.

## Prerequisites

- Docker Desktop installed and running
- Node.js 20+ installed
- pnpm 8+ installed
- Git configured

## First Time Setup

Run the complete setup (only needed once):

```bash
./dev.sh setup
```

This will:

- Check Docker is running
- Create environment files
- Install dependencies
- Start infrastructure
- Setup database with seed data

## Daily Development Workflow

### Option 1: Multi-Terminal (Recommended)

Open 3 terminals in your project root:

**Terminal 1 - Infrastructure:**

```bash
./dev.sh infra
```

Leave this running. You'll see PostgreSQL and MinIO logs.

**Terminal 2 - Backend:**

```bash
./dev.sh backend
```

Backend will start at http://localhost:4000/graphql
Hot reload is enabled - changes to `.ts` files will auto-reload.

**Terminal 3 - Frontend:**

```bash
./dev.sh frontend
```

Frontend will start at http://localhost:3000
Hot reload is enabled - changes to `.tsx` files will auto-reload.

### Option 2: All-in-One (Quick Testing)

If you just want to quickly test something:

```bash
./dev.sh start
```

This starts infrastructure and both dev servers together in one terminal.

## Accessing the Application

1. Open your browser to http://localhost:3000
2. Click "Login"
3. Use credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
4. You'll be redirected to the dashboard

## Useful Commands

### Check Everything is Working

```bash
./dev.sh health
```

### View Logs

```bash
./dev.sh infra-logs    # Infrastructure logs
./dev.sh backend-logs  # Backend logs (if using background mode)
./dev.sh frontend-logs # Frontend logs (if using background mode)
```

### Check Port Conflicts

```bash
./dev.sh ports
```

### Database Operations

```bash
./dev.sh db-reset      # Reset database (deletes all data!)
./dev.sh db-setup      # Run migrations and seed
```

### Clean Install

```bash
./dev.sh clean         # Remove node_modules and reinstall
```

### Run Tests

```bash
./dev.sh test          # Run backend tests
```

### Open URLs in Browser

```bash
./dev.sh open          # Opens frontend, backend GraphQL, and MinIO console
```

## Stopping Services

### Stop Everything

```bash
./dev.sh stop
```

### Stop Individual Services

Just press `Ctrl+C` in each terminal window.

## Troubleshooting

### Port Already in Use

If you see port conflict errors:

```bash
./dev.sh ports         # See what's using the ports
./dev.sh stop          # Stop all services
```

Then start again with `./dev.sh infra` and `./dev.sh backend` and `./dev.sh frontend`.

### Backend Won't Start

1. Check infrastructure is running:

   ```bash
   ./dev.sh status
   ```

2. Check database is accessible:

   ```bash
   docker ps
   ```

3. View logs:
   ```bash
   cd backend
   pnpm start:dev
   ```

### Frontend Shows Unauthorized Error

You need to login first:

1. Go to http://localhost:3000/login
2. Login with `admin@example.com` / `admin123`
3. Now visit http://localhost:3000/dashboard

### Docker Won't Start

```bash
# Check Docker is installed
docker --version

# Try starting Docker manually
open -a Docker  # macOS
```

## IDE Setup

### VS Code

Recommended extensions:

- ESLint
- Prettier
- GraphQL
- Prisma

### Debugging

**Backend Debugging:**

1. Set breakpoints in VS Code
2. In Terminal 2, start backend with debug flag:
   ```bash
   cd backend
   pnpm start:debug
   ```
3. Attach VS Code debugger (F5)

**Frontend Debugging:**

1. Use Chrome DevTools
2. React DevTools extension
3. VS Code debugger for Next.js

## Making Changes

### Backend Changes

- Modify files in `backend/src/`
- Server auto-reloads on save
- Check Terminal 2 for any errors

### Frontend Changes

- Modify files in `frontend/src/`
- Browser auto-reloads on save
- Check Terminal 3 and browser console for errors

### Database Schema Changes

```bash
cd backend
pnpm prisma migrate dev --name your_migration_name
```

### GraphQL Schema Changes

1. Modify `backend/src/**/*.resolver.ts` or entities
2. Server auto-generates schema
3. Check `backend/src/schema.gql`

## Next Steps

- Read [Development Workflow Spec](./DEV_WORKFLOW_SPEC.md) for complete workflow
- Check [Commit Message Guide](./COMMIT_GUIDE.md) for conventional commits
- Review project architecture in main README

## Getting Help

```bash
./dev.sh help          # Show all available commands
./dev.sh health        # Diagnose issues
```

## Tips

1. **Keep infrastructure running** - Only restart it when needed
2. **Use multiple terminals** - Easier to see logs and debug
3. **Check health often** - Catch issues early
4. **Commit frequently** - Use conventional commit messages
5. **Run tests** - Before pushing changes
