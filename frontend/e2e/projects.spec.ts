import { test, expect } from './fixtures/auth';

test.describe('Project Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Navigate to projects page before each test
    await adminPage.goto('/projects');
    await adminPage.waitForLoadState('networkidle');
  });

  test('should display projects page', async ({ adminPage }) => {
    // Check page title
    await expect(adminPage.getByRole('heading', { name: /projects/i })).toBeVisible();

    // Check for create button
    await expect(adminPage.getByRole('button', { name: /create project/i })).toBeVisible();

    // Check for table headers
    await expect(adminPage.getByRole('columnheader', { name: /code/i })).toBeVisible();
    await expect(adminPage.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(adminPage.getByRole('columnheader', { name: /description/i })).toBeVisible();
    await expect(adminPage.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });

  test('should open create project dialog', async ({ adminPage }) => {
    // Click create button
    await adminPage.getByRole('button', { name: /create project/i }).click();

    // Check dialog is visible
    await expect(adminPage.getByRole('heading', { name: /create new project/i })).toBeVisible();

    // Check form fields
    await expect(adminPage.getByLabel(/project code/i)).toBeVisible();
    await expect(adminPage.getByLabel(/project name/i)).toBeVisible();
    await expect(adminPage.getByLabel(/description/i)).toBeVisible();

    // Check buttons
    await expect(adminPage.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: /create project/i })).toBeVisible();
  });

  test('should create a new project successfully', async ({ adminPage }) => {
    const timestamp = Date.now();
    const projectCode = `E2E-${timestamp}`;
    const projectName = `E2E Test Project ${timestamp}`;
    const projectDescription = 'Created by E2E test';

    // Open create dialog
    await adminPage.getByRole('button', { name: /create project/i }).click();

    // Fill in the form
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill(projectName);
    await adminPage.getByLabel(/description/i).fill(projectDescription);

    // Submit form
    await adminPage.getByRole('button', { name: /create project/i }).click();

    // Wait for dialog to close
    await expect(adminPage.getByRole('heading', { name: /create new project/i })).not.toBeVisible();

    // Verify project appears in table
    await expect(adminPage.getByRole('cell', { name: projectCode, exact: true })).toBeVisible();
    await expect(adminPage.getByText(projectName)).toBeVisible();
    await expect(adminPage.getByText(projectDescription)).toBeVisible();
    await expect(adminPage.getByText('Active')).toBeVisible();
  });

  test('should validate required fields when creating project', async ({ adminPage }) => {
    // Open create dialog
    await adminPage.getByRole('button', { name: /create project/i }).click();

    // Try to submit without filling fields
    const createButton = adminPage.getByRole('button', { name: /create project/i });

    // Button should be disabled when fields are empty
    await expect(createButton).toBeDisabled();

    // Fill only code
    await adminPage.getByLabel(/project code/i).fill('TEST');
    await expect(createButton).toBeDisabled();

    // Fill code and name
    await adminPage.getByLabel(/project name/i).fill('Test Project');

    // Now button should be enabled (description is optional)
    await expect(createButton).toBeEnabled();
  });

  test('should show error for duplicate project code', async ({ adminPage }) => {
    const timestamp = Date.now();
    const projectCode = `DUP-${timestamp}`;

    // Create first project
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('First Project');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.waitForTimeout(1000); // Wait for creation

    // Try to create second project with same code
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('Second Project');

    // Listen for alert
    adminPage.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('already exists');
      await dialog.accept();
    });

    await adminPage.getByRole('button', { name: /create project/i }).click();
  });

  test('should view project details', async ({ adminPage }) => {
    const timestamp = Date.now();
    const projectCode = `VIEW-${timestamp}`;

    // Create a project first
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('View Test Project');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.waitForTimeout(1000);

    // Find and click view button for the project
    const row = adminPage.getByRole('row').filter({ hasText: projectCode });
    await row.getByRole('button', { name: /view/i }).click();

    // Should navigate to project detail page
    await expect(adminPage).toHaveURL(/\/projects\/[\w-]+/);

    // Check project details are displayed
    await expect(adminPage.getByRole('heading', { name: /view test project/i })).toBeVisible();
    await expect(adminPage.getByText(projectCode)).toBeVisible();

    // Check action buttons are available
    await expect(adminPage.getByRole('button', { name: /create group/i })).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: /create top-level subject/i }),
    ).toBeVisible();
  });

  test('should delete project with confirmation', async ({ adminPage }) => {
    const timestamp = Date.now();
    const projectCode = `DEL-${timestamp}`;

    // Create a project first
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('Delete Test Project');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.waitForTimeout(1000);

    // Set up dialog handler for confirmation
    adminPage.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('delete');
      await dialog.accept();
    });

    // Find and click delete button
    const row = adminPage.getByRole('row').filter({ hasText: projectCode });
    await row.getByRole('button', { name: /delete/i }).click();

    // Wait for deletion
    await adminPage.waitForTimeout(1000);

    // Project should no longer be visible
    await expect(adminPage.getByRole('cell', { name: projectCode, exact: true })).not.toBeVisible();
  });

  test('should cancel project deletion', async ({ adminPage }) => {
    const timestamp = Date.now();
    const projectCode = `CANCEL-${timestamp}`;

    // Create a project first
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('Cancel Delete Project');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.waitForTimeout(1000);

    // Set up dialog handler to cancel
    adminPage.on('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    // Find and click delete button
    const row = adminPage.getByRole('row').filter({ hasText: projectCode });
    await row.getByRole('button', { name: /delete/i }).click();

    // Wait a moment
    await adminPage.waitForTimeout(500);

    // Project should still be visible
    await expect(adminPage.getByRole('cell', { name: projectCode, exact: true })).toBeVisible();
  });

  test('should navigate between projects list and detail page', async ({ adminPage }) => {
    // Should be on projects list
    await expect(adminPage).toHaveURL('/projects');

    // Create a project
    const timestamp = Date.now();
    const projectCode = `NAV-${timestamp}`;
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('Navigation Test');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.waitForTimeout(1000);

    // Navigate to detail page
    const row = adminPage.getByRole('row').filter({ hasText: projectCode });
    await row.getByRole('button', { name: /view/i }).click();
    await expect(adminPage).toHaveURL(/\/projects\/[\w-]+/);

    // Navigate back using header link
    await adminPage.getByRole('link', { name: /projects/i }).click();
    await expect(adminPage).toHaveURL('/projects');

    // Project should still be visible
    await expect(adminPage.getByRole('cell', { name: projectCode, exact: true })).toBeVisible();
  });
});
