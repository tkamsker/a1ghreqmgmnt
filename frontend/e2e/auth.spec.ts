import { test, expect } from '@playwright/test';

import { TEST_USERS } from './fixtures/auth';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.getByLabel(/email/i).fill(TEST_USERS.admin.email);
    await page.getByLabel(/password/i).fill(TEST_USERS.admin.password);

    // Click login
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');

    // Should see user management page
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Click login
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/login/);

    // Wait for error message (adjust selector based on your UI)
    await expect(page.locator('text=/invalid|error|failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USERS.admin.email);
    await page.getByLabel(/password/i).fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');

    // Open user menu dropdown and click logout
    await page
      .getByRole('button', { name: /admin|contributor/i })
      .first()
      .click();
    await page.getByRole('menuitem', { name: /log out/i }).click();

    // Should redirect to login
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USERS.admin.email);
    await page.getByLabel(/password/i).fill(TEST_USERS.admin.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
  });

  test('should not allow access to protected routes when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });
});
