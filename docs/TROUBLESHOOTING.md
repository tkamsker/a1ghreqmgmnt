# Troubleshooting Guide

## Frontend Issues

### Endless Loading on http://localhost:3000

**Symptoms:**

- Homepage shows spinning loader indefinitely
- Page never redirects to login or dashboard

**Causes:**

1. Corrupted localStorage
2. Apollo Client connection issues
3. Browser cache issues

**Solutions:**

#### Solution 1: Clear Browser Storage (Recommended)

1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under **Local Storage**, click on `http://localhost:3000`
4. Click "Clear All" or delete these keys:
   - `accessToken`
   - `refreshToken`
   - `user`
5. Refresh the page

**Quick way:**

- Open Console (F12) and run:
  ```javascript
  localStorage.clear();
  location.reload();
  ```

#### Solution 2: Access Login Page Directly

Instead of `http://localhost:3000`, go directly to:

```
http://localhost:3000/login
```

Then login with:

- Email: `admin@example.com`
- Password: `admin123`

#### Solution 3: Check Backend Connection

1. Verify backend is running:

   ```bash
   curl http://localhost:4000/graphql -H "Content-Type: application/json" \
     -d '{"query":"{ __typename }"}'
   ```

   Should return: `{"data":{"__typename":"Query"}}`

2. Check if backend is accessible from browser:
   - Open http://localhost:4000/graphql in browser
   - Should see GraphQL Playground

#### Solution 4: Check Browser Console

1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Common errors:
   - `Failed to fetch` - Backend not running
   - `CORS error` - Backend CORS misconfigured
   - `NetworkError` - Network/firewall issue
   - `GraphQL error: Unauthorized` - Token expired (clear storage)

#### Solution 5: Restart Services

```bash
# Stop everything
./dev.sh stop

# Start fresh
./dev.sh infra    # Terminal 1
./dev.sh backend  # Terminal 2
./dev.sh frontend # Terminal 3
```

Then try: http://localhost:3000/login

### Backend Shows "Port Already in Use"

**Error:**

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**

```bash
# Option 1: Use dev.sh (will prompt to kill)
./dev.sh backend

# Option 2: Check what's using the port
./dev.sh ports

# Option 3: Manually kill the process
lsof -ti :4000 | xargs kill

# Option 4: Stop everything
./dev.sh stop
```

### Frontend Shows "Port Already in Use"

**Error:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Option 1: Use dev.sh (will prompt to kill)
./dev.sh frontend

# Option 2: Manually kill the process
lsof -ti :3000 | xargs kill

# Option 3: Stop everything
./dev.sh stop
```

### Dashboard Shows "Unauthorized"

**Symptoms:**

- Can access frontend
- Dashboard shows "Error loading users: Unauthorized"

**Cause:**
You need to login first

**Solution:**

1. Go to http://localhost:3000/login
2. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
3. You'll be redirected to dashboard
4. JWT token is now stored in localStorage

### GraphQL Errors in Browser Console

**Error:** `GraphQL error: UNAUTHENTICATED`

**Solution:**

1. Clear localStorage
2. Login again at http://localhost:3000/login

**Error:** `Network error: Failed to fetch`

**Solution:**

1. Check backend is running: `./dev.sh status`
2. Check backend logs: Terminal where backend is running
3. Restart backend: `./dev.sh backend`

## Backend Issues

### Database Connection Errors

**Error:**

```
PrismaClientInitializationError: Can't reach database server
```

**Solution:**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start infrastructure
./dev.sh infra-start

# Check PostgreSQL logs
cd infra && docker compose logs postgres
```

### Prisma Schema Changes Not Applied

**Symptoms:**

- Made changes to `backend/prisma/schema.prisma`
- Backend shows errors about missing columns/tables

**Solution:**

```bash
cd backend

# Create migration
pnpm prisma migrate dev --name your_migration_name

# Generate Prisma client
pnpm prisma generate

# Restart backend
# (Press Ctrl+C in backend terminal, then restart)
```

### MinIO Connection Errors

**Error:**

```
Error uploading to S3: Connection refused
```

**Solution:**

```bash
# Check if MinIO is running
docker ps | grep minio

# If not running, start infrastructure
./dev.sh infra-start

# Test MinIO console
open http://localhost:9001
# Login with: admin / admin123
```

## Infrastructure Issues

### Docker Not Starting

**Error:**

```
Cannot connect to Docker daemon
```

**Solution:**

```bash
# macOS
open -a Docker

# Wait for Docker to start
./dev.sh docker

# Linux
sudo systemctl start docker
```

### Docker Compose Warnings

**Warning:**

```
the attribute `version` is obsolete
```

**Solution:**
Already fixed! The `version` attribute has been removed from docker-compose.yml

### Database Won't Start

**Error:**

```
PostgreSQL failed to start after 30 seconds
```

**Solution:**

```bash
# Check logs
cd infra && docker compose logs postgres

# Common fixes:

# 1. Port conflict
lsof -i :5432  # See what's using it
./dev.sh ports # Check all ports

# 2. Remove old data and restart
cd infra
docker compose down -v  # WARNING: Deletes data
docker compose up -d

# 3. Reset database
./dev.sh db-reset
```

## Development Workflow Issues

### Changes Not Hot Reloading

**Backend not reloading:**

1. Check if `--watch` flag is present in backend logs
2. Restart backend: Ctrl+C, then `./dev.sh backend`
3. Check file permissions

**Frontend not reloading:**

1. Check if `.next` directory is writable
2. Clear Next.js cache: `rm -rf frontend/.next`
3. Restart frontend

### Can't Access Services from Other Devices

**Problem:**
Want to test on phone/tablet but can't access http://localhost:3000

**Solution:**

1. Find your local IP:

   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Access using IP instead:

   ```
   http://192.168.1.XXX:3000  # Replace with your IP
   ```

3. Update backend URL in `frontend/.env`:

   ```bash
   NEXT_PUBLIC_API_URL=http://192.168.1.XXX:4000/graphql
   ```

4. Update CORS in `backend/.env`:

   ```bash
   FRONTEND_URL=http://192.168.1.XXX:3000
   ```

5. Restart both services

## Testing Issues

### Tests Failing

**Error:**

```
Connection refused to database
```

**Solution:**

```bash
# Make sure infrastructure is running
./dev.sh infra-start

# Run tests
./dev.sh test
```

### E2E Tests Can't Find Browser

**Solution:**

```bash
# Install Playwright browsers
cd frontend
pnpm exec playwright install
```

## Health Check

Run comprehensive health check:

```bash
./dev.sh health
```

This checks:

- Docker daemon status
- Infrastructure services (PostgreSQL, MinIO)
- Backend service
- Frontend service
- Environment configuration

## Port Reference

| Service       | Port | Check                         |
| ------------- | ---- | ----------------------------- |
| Frontend      | 3000 | http://localhost:3000         |
| Backend       | 4000 | http://localhost:4000/graphql |
| PostgreSQL    | 5432 | `docker ps \| grep postgres`  |
| MinIO API     | 9000 | Internal use                  |
| MinIO Console | 9001 | http://localhost:9001         |

## Quick Commands Reference

```bash
# Check everything
./dev.sh health

# Check ports
./dev.sh ports

# Check status
./dev.sh status

# View logs
./dev.sh infra-logs     # Infrastructure
# Check backend/frontend terminal windows for their logs

# Stop everything
./dev.sh stop

# Start fresh
./dev.sh infra          # Terminal 1
./dev.sh backend        # Terminal 2
./dev.sh frontend       # Terminal 3
```

## Still Having Issues?

1. Check logs in the terminal windows
2. Check browser console (F12)
3. Run `./dev.sh health`
4. Try `./dev.sh stop` then start fresh
5. Check `docs/QUICK_START_DEV.md` for setup steps
