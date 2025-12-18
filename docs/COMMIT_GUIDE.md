# Commit Message Guide

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Description                   | Version Bump  | Example                               |
| ---------- | ----------------------------- | ------------- | ------------------------------------- |
| `feat`     | New feature                   | Minor (1.x.0) | `feat: add user export functionality` |
| `fix`      | Bug fix                       | Patch (1.0.x) | `fix: resolve login timeout issue`    |
| `perf`     | Performance improvement       | Patch (1.0.x) | `perf: optimize database queries`     |
| `refactor` | Code refactoring              | Patch (1.0.x) | `refactor: restructure auth module`   |
| `docs`     | Documentation only            | None          | `docs: update API documentation`      |
| `style`    | Code style (formatting, etc.) | None          | `style: format with prettier`         |
| `test`     | Adding or updating tests      | None          | `test: add user service tests`        |
| `build`    | Build system changes          | None          | `build: update webpack config`        |
| `ci`       | CI/CD changes                 | None          | `ci: add GitHub Actions workflow`     |
| `chore`    | Maintenance tasks             | None          | `chore: update dependencies`          |
| `revert`   | Revert previous commit        | Patch (1.0.x) | `revert: revert commit abc123`        |

## Breaking Changes

Breaking changes trigger a **major version bump** (x.0.0):

```bash
feat!: redesign authentication API

BREAKING CHANGE: The authentication API has been redesigned.
Previous /auth/login endpoint is now /api/v2/auth/login.
```

Or using the footer:

```bash
feat: add new authentication flow

The new flow provides better security.

BREAKING CHANGE: Old authentication tokens are no longer valid.
```

## Scopes

Scopes help organize changes by area of the codebase:

```bash
feat(backend): add user export endpoint
fix(frontend): resolve dashboard loading issue
docs(api): update GraphQL schema docs
test(users): add user service integration tests
```

Common scopes:

- `backend` - Backend changes
- `frontend` - Frontend changes
- `api` - API changes
- `db` - Database changes
- `auth` - Authentication/authorization
- `ui` - UI components
- `docs` - Documentation
- `ci` - CI/CD pipeline
- `deps` - Dependency updates

## Examples

### Feature Addition (Minor Version)

```bash
feat: add project export to CSV

Allows users to export project data to CSV format.
Includes all project metadata and requirements.
```

### Bug Fix (Patch Version)

```bash
fix: resolve dashboard crash on empty project list

Previously the dashboard would crash when a user had no projects.
Now displays an empty state message instead.

Fixes #123
```

### Multiple Changes

```bash
feat(backend): add bulk user operations

- Add bulk create endpoint
- Add bulk update endpoint
- Add bulk delete endpoint
- Add proper validation for all operations

Closes #456
```

### Performance Improvement

```bash
perf(backend): optimize user query with indexes

Added indexes on user.email and user.username fields.
Query performance improved from 500ms to 50ms for large datasets.
```

### Breaking Change (Major Version)

```bash
feat!: migrate to GraphQL API

BREAKING CHANGE: REST API has been removed in favor of GraphQL.
All clients must update to use GraphQL endpoints.

Migration guide: docs/MIGRATION.md
```

### Documentation

```bash
docs: add development workflow guide

Added comprehensive guide covering:
- Multi-terminal development workflow
- Docker Compose for staging
- Kubernetes deployment for production
```

### Refactoring

```bash
refactor(auth): extract JWT logic to separate service

Improved code organization and testability by extracting JWT
token generation and validation into a dedicated service.

No functional changes.
```

### Test Addition

```bash
test(users): add integration tests for user management

- Test user creation
- Test user updates
- Test user deletion
- Test duplicate email validation

Coverage increased to 85%
```

### Chore

```bash
chore: update dependencies

Updated all dependencies to latest versions:
- next: 14.0.0 -> 14.1.0
- nestjs: 10.2.0 -> 10.3.0
- prisma: 5.6.0 -> 5.7.0
```

### Reverting a Commit

```bash
revert: revert "feat: add experimental caching"

This reverts commit a1b2c3d4.

Reason: Caching caused issues in production environment.
```

## Commit Message Body

The body should include:

- **What** changed
- **Why** it changed
- **Any side effects** or important notes

```bash
feat(backend): implement request rate limiting

Added rate limiting middleware to prevent API abuse.
Uses Redis for distributed rate limiting across instances.

Default limits:
- 100 requests per minute for authenticated users
- 20 requests per minute for anonymous users

Affects all API endpoints except health checks.
```

## Commit Message Footer

The footer can include:

- Issue references
- Breaking change notes
- Other metadata

```bash
feat: add user profile customization

BREAKING CHANGE: User schema has changed.
See migration guide in docs/MIGRATION.md

Closes #123, #456
Refs #789
```

## Common Patterns

### Fixing a Bug Reported in an Issue

```bash
fix: prevent null pointer in dashboard

Fixed crash when rendering projects without descriptions.

Fixes #123
```

### Adding a Feature from a Feature Request

```bash
feat: add dark mode support

Implemented system-wide dark mode with user preference storage.

Closes #456
```

### Multiple Related Fixes

```bash
fix: resolve authentication issues

- Fix token expiration handling
- Fix refresh token rotation
- Fix logout race condition

Fixes #123, #124, #125
```

## Rules

1. **Use lowercase** for type and description
2. **No period** at the end of the description
3. **Max 100 characters** for the header
4. **Blank line** between header and body
5. **Max 200 characters** per body line
6. **Use imperative mood**: "add" not "added" or "adds"

## Validation

Commits are validated using [commitlint](https://commitlint.js.org/).

Invalid commits will be rejected:

```bash
❌ Added new feature        # Wrong: past tense
❌ feat: Added new feature  # Wrong: capitalized, past tense
❌ new feature              # Wrong: no type
✅ feat: add new feature    # Correct!
```

## IDE Integration

### VS Code

Install the [Conventional Commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) extension for commit message assistance.

### Git Hooks

The project uses Husky to enforce commit message format:

```bash
pnpm install   # Installs git hooks
git commit     # Will validate your commit message
```

## Tips

1. **Commit often** - Small, focused commits are better
2. **One purpose per commit** - Don't mix features and fixes
3. **Write meaningful descriptions** - Future you will thank you
4. **Reference issues** - Link commits to issues/tickets
5. **Test before committing** - Ensure tests pass

## Semantic Release

Based on your commits, semantic-release will:

- **feat** → Minor version bump (1.1.0)
- **fix** → Patch version bump (1.0.1)
- **BREAKING CHANGE** → Major version bump (2.0.0)
- **docs, style, test, etc.** → No version bump

### Release Channels

| Branch  | Prerelease | Example Version |
| ------- | ---------- | --------------- |
| `dev`   | alpha      | 1.0.0-alpha.1   |
| `stage` | rc         | 1.0.0-rc.1      |
| `main`  | stable     | 1.0.0           |

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://github.com/semantic-release/semantic-release)
- [Commitlint](https://commitlint.js.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

## Questions?

See examples in project history:

```bash
git log --oneline --graph
```

Or ask the team in Slack #dev-help
