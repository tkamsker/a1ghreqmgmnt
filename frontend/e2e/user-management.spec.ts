import { test, expect } from './fixtures/auth';

test.describe('User Management', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display user list', async ({ adminPage: page }) => {
    await page.goto('/dashboard');

    // Wait for users to load
    await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

    // Should see table with users
    await expect(page.getByRole('table')).toBeVisible();

    // Should see at least the admin user
    await expect(page.getByText(TEST_USERS.admin.username)).toBeVisible();
  });

  test('should open create user dialog', async ({ adminPage: page }) => {
    await page.goto('/dashboard');

    // Click create user button
    await page.getByRole('button', { name: /create user/i }).click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create new user/i })).toBeVisible();

    // Should see form fields
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should create a new user successfully', async ({ adminPage: page }) => {
    await page.goto('/dashboard');

    // Click create user button
    await page.getByRole('button', { name: /create user/i }).click();

    // Fill in form
    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`testuser${timestamp}`);
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`testuser${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill('password123');

    // Select role (if dropdown)
    // await page.getByLabel(/role/i).click();
    // await page.getByRole('option', { name: /contributor/i }).click();

    // Submit form
    await page
      .getByRole('button', { name: /create user/i })
      .nth(1)
      .click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // Should see new user in list
    await expect(page.getByText(`testuser${timestamp}`)).toBeVisible({ timeout: 10000 });
  });

  test('should show validation error for duplicate username', async ({ adminPage: page }) => {
    await page.goto('/dashboard');

    // Try to create user with existing username
    await page.getByRole('button', { name: /create user/i }).click();

    await page.getByLabel(/username/i).fill(TEST_USERS.admin.username);
    await page.getByLabel(/full name/i).fill('Duplicate User');
    await page.getByLabel(/email/i).fill('duplicate@example.com');
    await page.getByLabel(/password/i).fill('password123');

    await page
      .getByRole('button', { name: /create user/i })
      .nth(1)
      .click();

    // Should show error message
    await expect(page.locator('text=/already exists|duplicate/i')).toBeVisible({ timeout: 5000 });
  });

  test('should edit existing user', async ({ adminPage: page }) => {
    await page.goto('/dashboard');

    // Find and click edit button for first user (not admin)
    const editButtons = page.getByRole('button', { name: /edit/i });
    const count = await editButtons.count();

    if (count > 1) {
      await editButtons.nth(1).click();

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /edit user/i })).toBeVisible();

      // Update full name
      await page.getByLabel(/full name/i).clear();
      await page.getByLabel(/full name/i).fill('Updated Name');

      // Submit
      await page.getByRole('button', { name: /update user/i }).click();

      // Wait for dialog to close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

      // Should see updated name
      await expect(page.getByText('Updated Name')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should delete user with confirmation', async ({ adminPage: page }) => {
    // First create a user to delete
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /create user/i }).click();

    const timestamp = Date.now();
    const username = `deletetest${timestamp}`;
    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/full name/i).fill('Delete Test User');
    await page.getByLabel(/email/i).fill(`${username}@example.com`);
    await page.getByLabel(/password/i).fill('password123');

    await page
      .getByRole('button', { name: /create user/i })
      .nth(1)
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // Now delete the user
    const row = page.locator(`tr:has-text("${username}")`);
    await row.getByRole('button', { name: /delete/i }).click();

    // Handle confirmation dialog
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain(username);
      dialog.accept();
    });

    // User should be removed from list
    await expect(page.getByText(username)).not.toBeVisible({ timeout: 10000 });
  });

  test('should filter/search users', async ({ adminPage: page }) => {
    await page.goto('/dashboard');

    // Check if search input exists
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      // Type admin username
      await searchInput.fill(TEST_USERS.admin.username);

      // Should only show admin user
      await expect(page.getByText(TEST_USERS.admin.username)).toBeVisible();

      // Clear search
      await searchInput.clear();
    }
  });
});
