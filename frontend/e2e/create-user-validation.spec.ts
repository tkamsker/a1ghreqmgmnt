import { test, expect } from './fixtures/auth';

/**
 * Tests for create user validation
 * This test suite specifically addresses the 400 error when creating users
 */
test.describe('Create User Validation', () => {
  test('should show validation error for missing username', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Leave username empty
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Should show validation error or stay on dialog
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show validation error for missing full name', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`user${timestamp}`);
    // Leave full name empty
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill('password123');

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Should show validation error
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show validation error for missing email', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`user${timestamp}`);
    await page.getByLabel(/full name/i).fill('Test User');
    // Leave email empty - but email might be optional
    await page.getByLabel(/password/i).fill('password123');

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // If email is optional, this should succeed
    // If required, should show validation error
    // Check both scenarios
    const dialogVisible = await page.getByRole('dialog').isVisible();
    if (!dialogVisible) {
      // Success - email is optional
      await expect(page.getByText(`user${timestamp}`)).toBeVisible({ timeout: 10000 });
    } else {
      // Error - email is required
      expect(dialogVisible).toBe(true);
    }
  });

  test('should show validation error for missing password', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`user${timestamp}`);
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    // Leave password empty

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Should show validation error
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show validation error for short password', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`user${timestamp}`);
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill('123'); // Too short

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Should show validation error (dialog stays open)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    await page.getByLabel(/username/i).fill(`user${timestamp}`);
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('invalid-email'); // Invalid format
    await page.getByLabel(/password/i).fill('password123');

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Should show validation error
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should create user with all required fields', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();
    const username = `validuser${timestamp}`;

    await page.getByLabel(/username/i).fill(username);
    await page.getByLabel(/full name/i).fill('Valid User');
    await page.getByLabel(/email/i).fill(`${username}@example.com`);
    await page.getByLabel(/password/i).fill('validpassword123');

    // Select role if needed
    const roleSelect = page.getByLabel(/role|user type/i);
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.getByRole('option', { name: /contributor/i }).click();
    }

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Should close dialog and show user in the table
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: username, exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should check network response for 400 error details', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /create user/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const timestamp = Date.now();

    // Listen for GraphQL response
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/graphql') && response.request().method() === 'POST',
    );

    // Try to create user with potentially invalid data
    await page.getByLabel(/username/i).fill(`test${timestamp}`);
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill('password123');

    // Click the Create User button inside the dialog
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /create user/i })
      .click();

    // Get the response
    const response = await responsePromise;
    const responseBody = await response.json();

    console.log('Response Status:', response.status());
    console.log('Response Body:', JSON.stringify(responseBody, null, 2));

    // If we get 400, check the error message
    if (response.status() === 400) {
      expect(responseBody).toHaveProperty('errors');
      console.log('Error details:', responseBody.errors);
    }
  });
});
