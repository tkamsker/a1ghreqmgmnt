# Development Workflow Specification

Version: 1.0.0
Last Updated: 2025-12-18

## Table of Contents

1. [Overview](#overview)
2. [Branch Strategy](#branch-strategy)
3. [Development Workflows](#development-workflows)
4. [Deployment Strategy](#deployment-strategy)
5. [Release Management](#release-management)
6. [Implementation Roadmap](#implementation-roadmap)

## Overview

This document defines the complete development, testing, and deployment workflow for the Requirements Management System across different branches and environments.

## Branch Strategy

### Branch Types

| Branch Type | Purpose                | Deployment Target | Workflow Mode         |
| ----------- | ---------------------- | ----------------- | --------------------- |
| `feature/*` | Feature development    | Local Dev         | Multi-terminal        |
| `dev`       | Integration branch     | Local Dev         | Multi-terminal        |
| `stage`     | Pre-production testing | Docker Compose    | Full containerization |
| `main`      | Production             | Kubernetes        | Full orchestration    |

### Branch Naming Convention

- `feature/ISSUE-123-short-description` - Feature branches
- `bugfix/ISSUE-456-short-description` - Bug fix branches
- `hotfix/ISSUE-789-short-description` - Production hotfixes
- `dev` - Development integration branch
- `stage` - Staging/pre-production branch
- `main` - Production branch

## Development Workflows

### 1. Feature/Dev Branch Workflow (Multi-Terminal)

**Target Branches:** `feature/*`, `dev`
**Environment:** Local development
**Approach:** Infrastructure in Docker, Backend and Frontend in separate terminals

#### Architecture

```
┌─────────────────────────────────────────┐
│          Docker (Infrastructure)        │
│  ┌────────────┐      ┌──────────────┐  │
│  │ PostgreSQL │      │    MinIO     │  │
│  │  Port 5432 │      │  Port 9000   │  │
│  └────────────┘      └──────────────┘  │
└─────────────────────────────────────────┘
         ▲                      ▲
         │                      │
         │                      │
┌────────┴─────────┐   ┌────────┴──────────┐
│  Terminal 2      │   │   Terminal 3      │
│  Backend (Node)  │   │  Frontend (Next)  │
│  Port 4000       │   │  Port 3000        │
│  Hot Reload ✓    │   │  Hot Reload ✓     │
└──────────────────┘   └───────────────────┘
```

#### Workflow Steps

**Setup (First Time):**

```bash
./dev.sh setup
```

**Daily Development:**

```bash
# Terminal 1: Infrastructure
./dev.sh infra

# Terminal 2: Backend
./dev.sh backend

# Terminal 3: Frontend
./dev.sh frontend
```

**Health Check:**

```bash
./dev.sh health
```

**Cleanup:**

```bash
./dev.sh stop
```

#### Benefits

- **Fast Hot Reload:** Direct access to backend/frontend console output
- **Easy Debugging:** Can attach debugger to Node processes
- **Clear Logs:** Each service has dedicated terminal
- **Resource Efficient:** No unnecessary containerization overhead
- **IDE Integration:** Full IDE debugging support

#### Requirements

- Docker Desktop (for infrastructure)
- Node.js 20+
- pnpm 8+
- PostgreSQL client tools (optional, for database access)

### 2. Stage Branch Workflow (Docker Compose)

**Target Branch:** `stage`
**Environment:** Staging/pre-production
**Approach:** Full containerization with Docker Compose

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Docker Compose Stack                     │
│                                                         │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐│
│  │ PostgreSQL │  │  MinIO   │  │ Backend │  │Frontend ││
│  │  Port 5432 │  │Port 9000 │  │Port 4000│  │Port 3000││
│  └────────────┘  └──────────┘  └─────────┘  └─────────┘│
│                                                         │
│  ┌────────────────────────────────────────┐            │
│  │         Traefik (Reverse Proxy)        │            │
│  │              Port 80/443               │            │
│  └────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

#### Workflow Steps

**Initial Setup:**

```bash
cd infra/docker-compose/stage
docker compose up -d
```

**View Logs:**

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

**Health Check:**

```bash
docker compose ps
curl http://localhost/health
```

**Update:**

```bash
git pull origin stage
docker compose pull
docker compose up -d --force-recreate
```

**Cleanup:**

```bash
docker compose down
docker compose down -v  # Remove volumes
```

#### Configuration Files

Required files in `infra/docker-compose/stage/`:

- `docker-compose.yml` - Main compose file
- `docker-compose.override.yml` - Stage-specific overrides
- `.env.stage` - Stage environment variables
- `nginx.conf` - Reverse proxy configuration

#### Benefits

- **Production-like Environment:** Mirrors production setup
- **Easy Testing:** Full stack integration testing
- **Isolated:** No local dependencies needed
- **Reproducible:** Identical across team members
- **CI/CD Ready:** Can run in CI pipelines

### 3. Main Branch Workflow (Kubernetes)

**Target Branch:** `main`
**Environment:** Production
**Approach:** Kubernetes orchestration with Helm charts

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Kubernetes Cluster (Production)            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Ingress Controller                  │   │
│  │         (NGINX/Traefik/cert-manager)           │   │
│  └───────────────────┬─────────────────────────────┘   │
│                      │                                  │
│  ┌───────────────────┴────────┬─────────────────────┐  │
│  │                            │                     │  │
│  │  ┌─────────────┐  ┌───────▼─────┐  ┌───────────▼┐ │
│  │  │  Backend    │  │  Frontend   │  │   MinIO    │ │
│  │  │   Pods      │  │    Pods     │  │   Pods     │ │
│  │  │ (Replica 3) │  │ (Replica 3) │  │(StatefulSet)││
│  │  └──────┬──────┘  └─────────────┘  └────────────┘ │
│  │         │                                          │ │
│  │    ┌────▼──────────┐                              │ │
│  │    │  PostgreSQL   │                              │ │
│  │    │ (StatefulSet) │                              │ │
│  │    │   or RDS      │                              │ │
│  │    └───────────────┘                              │ │
│  │                                                     │
│  │  ┌────────────────────────────────────────────┐   │
│  │  │  Horizontal Pod Autoscaler (HPA)           │   │
│  │  │  Prometheus Metrics                         │   │
│  │  │  Grafana Dashboards                         │   │
│  │  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Deployment Steps

**Prerequisites:**

- Kubernetes cluster (EKS/GKE/AKS)
- kubectl configured
- Helm 3+ installed
- Container registry access

**Deploy:**

```bash
# Using Helm
helm upgrade --install reqmgmt ./k8s/helm/reqmgmt \
  --namespace production \
  --values ./k8s/helm/values/production.yaml \
  --wait

# Using kubectl (alternative)
kubectl apply -f k8s/manifests/production/
```

**Monitor:**

```bash
kubectl get pods -n production
kubectl logs -f deployment/backend -n production
kubectl logs -f deployment/frontend -n production
```

**Scale:**

```bash
kubectl scale deployment/backend --replicas=5 -n production
kubectl scale deployment/frontend --replicas=5 -n production
```

**Rollback:**

```bash
helm rollback reqmgmt -n production
# or
kubectl rollout undo deployment/backend -n production
```

#### Configuration

Required K8s resources:

- Deployments (backend, frontend)
- StatefulSets (postgresql, minio)
- Services (ClusterIP, LoadBalancer)
- ConfigMaps (app config)
- Secrets (credentials, API keys)
- Ingress (routing)
- HPA (autoscaling)
- NetworkPolicies (security)
- PersistentVolumeClaims (storage)

#### Benefits

- **High Availability:** Multiple replicas, auto-healing
- **Auto-scaling:** HPA based on CPU/memory/custom metrics
- **Zero-downtime Deployments:** Rolling updates
- **Observability:** Integrated monitoring and logging
- **Security:** Network policies, secrets management
- **Resource Management:** Resource limits and requests

## Deployment Strategy

### Deployment Matrix

| Branch      | Trigger  | Build | Test | Deploy   | Approval |
| ----------- | -------- | ----- | ---- | -------- | -------- |
| `feature/*` | Push     | ✓     | ✓    | ✗        | N/A      |
| `dev`       | Merge PR | ✓     | ✓    | ✗        | N/A      |
| `stage`     | Merge PR | ✓     | ✓    | ✓ Docker | Auto     |
| `main`      | Merge PR | ✓     | ✓    | ✓ K8s    | Manual   |

### CI/CD Pipeline

#### Feature/Dev Branches

```yaml
Stages: 1. Lint & Format Check
  2. Unit Tests
  3. Integration Tests
  4. Build Validation
  5. Report to PR
```

#### Stage Branch

```yaml
Stages: 1. Lint & Format Check
  2. Unit Tests
  3. Integration Tests
  4. Build Docker Images
  5. Push to Registry
  6. Deploy to Stage (Docker Compose)
  7. E2E Tests
  8. Performance Tests
  9. Security Scan
```

#### Main Branch

```yaml
Stages: 1. All Stage Checks
  2. Build Production Images
  3. Push to Registry (with tags)
  4. Manual Approval Gate
  5. Deploy to Production (K8s)
  6. Smoke Tests
  7. Health Checks
  8. Monitor Rollout
  9. Notify Team
```

## Release Management

### Semantic Versioning

We use [semantic-release](https://github.com/semantic-release/semantic-release) for automated version management.

#### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE]

Examples:
- 1.0.0       (Production release)
- 1.1.0       (New feature)
- 1.1.1       (Bug fix)
- 1.2.0-rc.1  (Release candidate)
- 2.0.0-beta.3 (Beta release)
```

#### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature (minor version bump)
feat: add user authentication
feat(backend): implement JWT refresh tokens

# Fix (patch version bump)
fix: resolve dashboard loading issue
fix(frontend): correct API endpoint URL

# Breaking Change (major version bump)
feat!: redesign user management API
BREAKING CHANGE: User API endpoints have changed

# Other types (no version bump)
docs: update development workflow
style: format code with prettier
refactor: restructure auth module
test: add unit tests for user service
chore: update dependencies
ci: add GitHub Actions workflow
```

### Release Channels

| Branch  | Release Channel | Version Pattern | Frequency   |
| ------- | --------------- | --------------- | ----------- |
| `dev`   | alpha           | 1.0.0-alpha.X   | Every merge |
| `stage` | rc              | 1.0.0-rc.X      | Weekly      |
| `main`  | stable          | 1.0.0           | Bi-weekly   |

### Automated Releases

**Dev Branch (Alpha):**

```yaml
# Automatic on every merge
Version: 1.0.0-alpha.1, 1.0.0-alpha.2, ...
Publishes: Package registry only
Deployment: Not deployed
Notifications: Slack #dev-releases
```

**Stage Branch (Release Candidate):**

```yaml
# Automatic on merge to stage
Version: 1.0.0-rc.1, 1.0.0-rc.2, ...
Publishes: Package registry + release notes
Deployment: Automatically to staging
Notifications: Slack #staging-releases, Email to QA
```

**Main Branch (Stable):**

```yaml
# Automatic on merge to main (after approval)
Version: 1.0.0, 1.1.0, 2.0.0, ...
Publishes: Package registry + GitHub release
Deployment: Production (after manual approval)
Notifications: Slack #production-releases, Email to stakeholders
```

## Implementation Roadmap

### Phase 1: Current State (✅ Complete)

- [x] Multi-terminal dev workflow (feature/dev branches)
- [x] Dev.sh improvements with separate commands
- [x] Infrastructure in Docker
- [x] Backend/Frontend local development

### Phase 2: Docker Compose for Stage (Next)

**Timeline:** 1-2 weeks
**Priority:** High

#### Tasks

1. **Create Stage Docker Compose Setup** (3-4 days)
   - [ ] Create `infra/docker-compose/stage/docker-compose.yml`
   - [ ] Add backend Dockerfile with multi-stage build
   - [ ] Add frontend Dockerfile with optimized build
   - [ ] Configure reverse proxy (Traefik/NGINX)
   - [ ] Setup environment configuration
   - [ ] Add health checks to all services

2. **Update CI/CD for Stage** (2-3 days)
   - [ ] Add stage branch protection rules
   - [ ] Create GitHub Actions workflow for stage
   - [ ] Configure automated deployment
   - [ ] Add E2E test suite
   - [ ] Setup monitoring/logging

3. **Documentation** (1 day)
   - [ ] Stage deployment guide
   - [ ] Troubleshooting documentation
   - [ ] Architecture diagrams

### Phase 3: Kubernetes for Production (Future)

**Timeline:** 3-4 weeks
**Priority:** Medium

#### Tasks

1. **Infrastructure Setup** (1 week)
   - [ ] Choose K8s provider (EKS/GKE/AKS)
   - [ ] Setup cluster with Terraform
   - [ ] Configure networking and security
   - [ ] Setup monitoring (Prometheus/Grafana)
   - [ ] Configure logging (ELK/Loki)

2. **Application Deployment** (1-2 weeks)
   - [ ] Create Helm charts
   - [ ] Write Kubernetes manifests
   - [ ] Configure Ingress controller
   - [ ] Setup cert-manager for SSL
   - [ ] Configure HPA and resource limits
   - [ ] Implement rolling update strategy

3. **Database & Storage** (3-4 days)
   - [ ] Setup PostgreSQL (RDS or StatefulSet)
   - [ ] Configure persistent volumes
   - [ ] Setup backup and restore
   - [ ] Configure connection pooling

4. **CI/CD for Production** (3-4 days)
   - [ ] Production GitHub Actions workflow
   - [ ] Automated testing pipeline
   - [ ] Manual approval gates
   - [ ] Rollback procedures
   - [ ] Production deployment scripts

### Phase 4: Semantic Release Integration (Parallel)

**Timeline:** 1 week
**Priority:** Medium

#### Tasks

1. **Setup Semantic Release** (2-3 days)
   - [ ] Install and configure semantic-release
   - [ ] Configure release plugins
   - [ ] Setup commit lint
   - [ ] Create release configuration
   - [ ] Test release workflow

2. **Integration with Branches** (2-3 days)
   - [ ] Configure dev branch (alpha releases)
   - [ ] Configure stage branch (RC releases)
   - [ ] Configure main branch (stable releases)
   - [ ] Setup changelog generation
   - [ ] Configure notifications

3. **Documentation & Training** (1-2 days)
   - [ ] Write commit message guidelines
   - [ ] Create release process docs
   - [ ] Team training on conventional commits

## Summary

This specification provides a clear path from local development to production deployment:

1. **Feature/Dev:** Fast, flexible multi-terminal workflow for rapid development
2. **Stage:** Containerized environment for pre-production testing
3. **Main:** Kubernetes deployment for production-grade reliability

Each workflow is optimized for its use case, providing the right balance of speed, reliability, and production-readiness.
