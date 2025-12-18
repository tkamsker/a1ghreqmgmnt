# E2E Tests with Playwright

End-to-end tests for the Requirements Management System frontend.

## Setup

### Install Playwright Browsers

```bash
cd frontend
pnpm exec playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

## Running Tests

### Prerequisites

Make sure all services are running:

```bash
# Terminal 1 - Infrastructure
./dev.sh infra

# Terminal 2 - Backend
./dev.sh backend

# Terminal 3 - Frontend
./dev.sh frontend
```

### Run All Tests

```bash
cd frontend
pnpm test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
pnpm test:e2e:ui
```

This opens the Playwright Test UI where you can:

- See all tests
- Run individual tests
- Watch tests execute in real-time
- Debug failures

### Run Specific Test File

```bash
pnpm exec playwright test auth.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
pnpm exec playwright test --headed
```

### Run Tests in Debug Mode

```bash
pnpm exec playwright test --debug
```

### Run Tests for Specific Browser

```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

## Test Structure

```
e2e/
├── fixtures/
│   └── auth.ts              # Authentication helpers and fixtures
├── auth.spec.ts             # Authentication flow tests
├── user-management.spec.ts  # User CRUD operations tests
├── create-user-validation.spec.ts  # Input validation tests
└── README.md                # This file
```

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)

Tests the complete authentication flow:

- Login with valid credentials
- Login with invalid credentials
- Logout
- Protected route access
- Authentication persistence

**Run:**

```bash
pnpm exec playwright test auth.spec.ts
```

### 2. User Management Tests (`user-management.spec.ts`)

Tests CRUD operations for users:

- View user list
- Create new user
- Edit existing user
- Delete user
- Duplicate user validation

**Run:**

```bash
pnpm exec playwright test user-management.spec.ts
```

### 3. Create User Validation Tests (`create-user-validation.spec.ts`)

Tests input validation when creating users:

- Required field validation
- Email format validation
- Password length validation
- Network error inspection (400 errors)

**Run:**

```bash
pnpm exec playwright test create-user-validation.spec.ts
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');

    // Your test actions
    await page.click('button');

    // Your assertions
    await expect(page.locator('h1')).toHaveText('Expected Text');
  });
});
```

### Using Authentication Fixture

```typescript
import { test, expect } from './fixtures/auth';

test('should access protected page', async ({ adminPage: page }) => {
  // Already logged in as admin!
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard');
});
```

## Debugging Tests

### 1. Use UI Mode

```bash
pnpm test:e2e:ui
```

### 2. Use Debug Mode

```bash
pnpm exec playwright test --debug
```

### 3. Show Browser

```bash
pnpm exec playwright test --headed
```

### 4. Slow Down Tests

```bash
pnpm exec playwright test --headed --slow-mo=1000
```

### 5. Console Logs

Add console.log in tests:

```typescript
test('debug test', async ({ page }) => {
  const response = await page.goto('/');
  console.log('Status:', response?.status());
  console.log('URL:', page.url());
});
```

### 6. Screenshots

```typescript
test('take screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await page.screenshot({ path: 'screenshot.png' });
});
```

## Test Reports

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

## CI/CD Integration

The tests are configured to run in CI with:

- Retries on failure
- GitHub reporter
- Screenshots on failure
- Videos on failure

To run in CI mode:

```bash
CI=true pnpm test:e2e
```

## Common Issues

### Tests Fail with "Timeout"

**Cause:** Services not running or slow to start

**Solution:**

```bash
# Check services are running
./dev.sh health

# Restart services
./dev.sh stop
./dev.sh infra
./dev.sh backend
./dev.sh frontend
```

### Tests Fail with "Target Closed"

**Cause:** Browser crashed or page closed unexpectedly

**Solution:**

- Run with `--headed` to see what's happening
- Check for JavaScript errors in browser console
- Update Playwright: `pnpm exec playwright install`

### Authentication Tests Fail

**Cause:** Test data might be corrupted

**Solution:**

```bash
# Reset database
./dev.sh db-reset
```

### Can't Find Element

**Cause:** Element selector is wrong or element loads slowly

**Solution:**

```typescript
// Use waitFor
await page.waitForSelector('button[name="submit"]');

// Or use auto-waiting assertions
await expect(page.locator('button[name="submit"]')).toBeVisible();
```

## Best Practices

### 1. Use Data Test IDs

```tsx
// In React component
<button data-testid="create-user-btn">Create</button>
```

```typescript
// In test
await page.getByTestId('create-user-btn').click();
```

### 2. Avoid Hardcoded Waits

```typescript
// ❌ Bad
await page.waitForTimeout(3000);

// ✅ Good
await page.waitForURL('/dashboard');
await expect(page.locator('h1')).toBeVisible();
```

### 3. Use Fixtures for Common Setup

```typescript
test.beforeEach(async ({ page }) => {
  // Common setup
  await page.goto('/dashboard');
});
```

### 4. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await page.evaluate(() => localStorage.clear());
});
```

### 5. Make Tests Independent

Each test should be able to run independently without relying on other tests.

### 6. Use Descriptive Test Names

```typescript
// ✅ Good
test('should display validation error when email is invalid', ...)

// ❌ Bad
test('test1', ...)
```

## Tips

### Take Screenshots During Test

```typescript
await page.screenshot({ path: `debug-${Date.now()}.png` });
```

### Get Network Request/Response

```typescript
page.on('request', (request) => console.log('>>', request.method(), request.url()));
page.on('response', (response) => console.log('<<', response.status(), response.url()));
```

### Wait for Network Idle

```typescript
await page.goto('/dashboard', { waitUntil: 'networkidle' });
```

### Fill Form with Object

```typescript
await page.locator('#username').fill('testuser');
await page.locator('#email').fill('test@example.com');
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
