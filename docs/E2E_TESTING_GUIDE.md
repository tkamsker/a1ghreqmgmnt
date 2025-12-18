# E2E Testing Guide

Complete guide to End-to-End testing with Playwright for the Requirements Management System.

## Quick Start

### 1. Install Playwright Browsers (First Time Only)

```bash
cd frontend
pnpm exec playwright install
```

### 2. Start All Services

```bash
# Terminal 1 - Infrastructure
./dev.sh infra

# Terminal 2 - Backend
./dev.sh backend

# Terminal 3 - Frontend
./dev.sh frontend
```

### 3. Run E2E Tests

```bash
# Terminal 4 - Run tests
./dev.sh test:e2e
```

Or with interactive UI:

```bash
./dev.sh test:e2e:ui
```

## What Gets Tested

### 1. Authentication Flow (`e2e/auth.spec.ts`)

✅ Login with valid credentials
✅ Login with invalid credentials
✅ Logout functionality
✅ Protected route access
✅ Authentication persistence after reload
✅ Redirect to login when not authenticated

### 2. User Management (`e2e/user-management.spec.ts`)

✅ Display user list
✅ Open create user dialog
✅ Create new user successfully
✅ Duplicate username validation
✅ Edit existing user
✅ Delete user with confirmation
✅ Search/filter users

### 3. Input Validation (`e2e/create-user-validation.spec.ts`)

✅ Missing username validation
✅ Missing full name validation
✅ Missing email validation
✅ Missing password validation
✅ Short password validation
✅ Invalid email format validation
✅ Network error inspection (400 errors)

## Running Tests

### Using dev.sh (Recommended)

```bash
# Run all E2E tests
./dev.sh test:e2e

# Run with interactive UI
./dev.sh test:e2e:ui
```

The `dev.sh` script automatically checks that all services are running before executing tests.

### Using pnpm Directly

```bash
cd frontend

# Run all tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run specific test file
pnpm exec playwright test auth.spec.ts

# Run in headed mode (see browser)
pnpm exec playwright test --headed

# Run in debug mode
pnpm exec playwright test --debug

# Run specific browser
pnpm exec playwright test --project=chromium
```

## Test Modes

### 1. Headless Mode (Default)

Tests run in the background without showing the browser.

```bash
./dev.sh test:e2e
```

**Use when:**

- Running tests in CI/CD
- Quick test runs
- Automated testing

### 2. UI Mode (Interactive)

Opens Playwright Test UI with visual test runner.

```bash
./dev.sh test:e2e:ui
```

**Features:**

- See all tests and their status
- Run individual tests
- Watch tests execute in real-time
- Time travel through test execution
- Inspect DOM at each step
- See network requests
- Debug failures interactively

**Use when:**

- Debugging failing tests
- Writing new tests
- Understanding test flow
- Investigating issues

### 3. Headed Mode

Shows the actual browser window during test execution.

```bash
cd frontend
pnpm exec playwright test --headed
```

**Use when:**

- Debugging visual issues
- Understanding what's happening
- Demonstrating tests

### 4. Debug Mode

Steps through tests one action at a time.

```bash
cd frontend
pnpm exec playwright test --debug
```

**Features:**

- Pause execution
- Step through actions
- Inspect page state
- Use developer tools

## Test Structure

```
frontend/
├── e2e/
│   ├── fixtures/
│   │   └── auth.ts                    # Auth helpers & fixtures
│   ├── auth.spec.ts                   # Authentication tests
│   ├── user-management.spec.ts        # User CRUD tests
│   ├── create-user-validation.spec.ts # Validation tests
│   └── README.md                      # Detailed test docs
├── playwright.config.ts               # Playwright configuration
└── package.json                       # Test scripts
```

## Writing New Tests

### Basic Test

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  // Navigate
  await page.goto('/some-page');

  // Interact
  await page.getByRole('button', { name: 'Click me' }).click();

  // Assert
  await expect(page.locator('h1')).toHaveText('Success');
});
```

### Authenticated Test

```typescript
import { test, expect } from './fixtures/auth';

test('should access dashboard', async ({ adminPage: page }) => {
  // Already logged in as admin!
  await page.goto('/dashboard');

  await expect(page).toHaveURL('/dashboard');
});
```

### Test with Setup and Teardown

```typescript
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('should work', async ({ page }) => {
    // Your test
  });
});
```

## Debugging Tests

### 1. Use UI Mode (Best for Beginners)

```bash
./dev.sh test:e2e:ui
```

Click on any test to see:

- Each step of the test
- Screenshots at each step
- Network activity
- Console logs
- DOM state

### 2. Add Debug Statements

```typescript
test('debug test', async ({ page }) => {
  console.log('Current URL:', page.url());

  const text = await page.locator('h1').textContent();
  console.log('Header text:', text);

  await page.pause(); // Pause execution
});
```

### 3. Take Screenshots

```typescript
test('screenshot test', async ({ page }) => {
  await page.goto('/dashboard');
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

### 4. Inspect Network Calls

```typescript
test('network test', async ({ page }) => {
  // Listen to all network requests
  page.on('request', (req) => {
    console.log('>>', req.method(), req.url());
  });

  page.on('response', (res) => {
    console.log('<<', res.status(), res.url());
  });

  await page.goto('/dashboard');
});
```

### 5. Slow Down Test Execution

```bash
cd frontend
pnpm exec playwright test --headed --slow-mo=1000
```

## Common Issues & Solutions

### Issue: Test times out

**Error:** `page.goto: Timeout 30000ms exceeded`

**Solutions:**

1. Check services are running: `./dev.sh health`
2. Increase timeout: `await page.goto('/dashboard', { timeout: 60000 })`
3. Check backend logs for errors

### Issue: Can't find element

**Error:** `locator.click: Target closed`

**Solutions:**

1. Use better selectors:

   ```typescript
   // ❌ Bad
   await page.locator('button').click();

   // ✅ Good
   await page.getByRole('button', { name: 'Submit' }).click();
   ```

2. Wait for element:

   ```typescript
   await page.waitForSelector('button[name="submit"]');
   await page.locator('button[name="submit"]').click();
   ```

3. Use auto-waiting assertions:
   ```typescript
   await expect(page.locator('button')).toBeVisible();
   await page.locator('button').click();
   ```

### Issue: Authentication fails

**Error:** Tests fail at login step

**Solutions:**

1. Reset database:

   ```bash
   ./dev.sh db-reset
   ```

2. Check credentials in `e2e/fixtures/auth.ts`

3. Manually test login at http://localhost:3000/login

### Issue: Flaky tests (pass/fail randomly)

**Causes & Solutions:**

1. **Race conditions**

   ```typescript
   // ❌ Bad
   await page.click('button');
   await page.locator('.result').textContent(); // Might not be ready

   // ✅ Good
   await page.click('button');
   await expect(page.locator('.result')).toHaveText('Success');
   ```

2. **Network delays**

   ```typescript
   // Wait for specific network call
   await page.waitForResponse((res) => res.url().includes('/api/users') && res.status() === 200);
   ```

3. **Animation delays**
   ```typescript
   // Wait for dialog to fully appear
   await expect(page.getByRole('dialog')).toBeVisible();
   await page.waitForTimeout(300); // Wait for animation
   ```

### Issue: Tests work locally but fail in CI

**Solutions:**

1. Increase timeouts in CI
2. Use retry mechanism (already configured)
3. Check CI logs and screenshots
4. Run with `CI=true ./dev.sh test:e2e` locally

## Best Practices

### 1. Use Semantic Selectors

```typescript
// ✅ Good - Readable and resilient
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('test@example.com');
await page.getByText('Welcome').click();

// ❌ Bad - Fragile
await page.locator('.btn-primary').click();
await page.locator('#input-123').fill('test@example.com');
```

### 2. Use Data Test IDs for Complex Selectors

```tsx
// In component
<button data-testid="submit-form">Submit</button>
```

```typescript
// In test
await page.getByTestId('submit-form').click();
```

### 3. Wait for Specific Conditions

```typescript
// ✅ Good
await expect(page.locator('.spinner')).not.toBeVisible();
await expect(page.locator('.results')).toBeVisible();

// ❌ Bad
await page.waitForTimeout(5000);
```

### 4. Make Tests Independent

Each test should:

- Set up its own data
- Not depend on other tests
- Clean up after itself

```typescript
test.beforeEach(async ({ page }) => {
  // Set up test data
  await page.goto('/dashboard');
});

test.afterEach(async ({ page }) => {
  // Clean up
  await page.evaluate(() => localStorage.clear());
});
```

### 5. Use Descriptive Test Names

```typescript
// ✅ Good
test('should display validation error when email format is invalid', ...)

// ❌ Bad
test('email test', ...)
```

### 6. Group Related Tests

```typescript
test.describe('User Creation', () => {
  test.describe('Validation', () => {
    test('should validate email format', ...)
    test('should validate password length', ...)
  });

  test.describe('Success Cases', () => {
    test('should create user with all fields', ...)
  });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: cd frontend && pnpm exec playwright install --with-deps

      - name: Start services
        run: |
          ./dev.sh infra &
          ./dev.sh backend &
          ./dev.sh frontend &
          sleep 30

      - name: Run E2E tests
        run: ./dev.sh test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Troubleshooting the 400 Error

The test suite includes specific tests to catch the 400 error you encountered:

### Run Validation Tests

```bash
cd frontend
pnpm exec playwright test create-user-validation.spec.ts
```

This will:

1. Test all required field validations
2. Test input format validations
3. Capture and log 400 error responses
4. Show you exactly what data causes the error

### Debug the 400 Error

```bash
cd frontend
pnpm exec playwright test create-user-validation.spec.ts --headed --debug
```

Step through the test to see:

- What data is being sent
- What response comes back
- What error message appears

### Check Network Tab

The test includes network inspection:

```typescript
test('should check network response for 400 error details', async ({ adminPage: page }) => {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/graphql'));

  // Fill form and submit
  // ...

  const response = await responsePromise;
  const body = await response.json();

  console.log('Status:', response.status());
  console.log('Error:', body.errors);
});
```

## Reports

### View HTML Report

After running tests:

```bash
cd frontend
pnpm exec playwright show-report
```

This opens an interactive report showing:

- Test results
- Screenshots
- Videos
- Traces
- Logs

### Generate Report Manually

```bash
cd frontend
pnpm exec playwright test --reporter=html
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

## Next Steps

1. **Run the tests** to see current state
2. **Fix the 400 error** using validation tests
3. **Add new tests** for new features
4. **Integrate with CI/CD** pipeline
5. **Set up scheduled runs** for regression testing

Happy testing! 🎭
