import { test, expect } from './fixtures/auth';

test.describe('Project Hierarchy Management', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Create a test project for hierarchy tests
    await adminPage.goto('/projects');
    await adminPage.waitForLoadState('networkidle');

    const timestamp = Date.now();
    const projectCode = `HIER-${timestamp}`;

    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('Hierarchy Test Project');
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.waitForTimeout(1000);

    // Navigate to project detail page
    const row = adminPage.getByRole('row').filter({ hasText: projectCode });
    await row.getByRole('button', { name: /view/i }).click();
    await adminPage.waitForLoadState('networkidle');
  });

  test.describe('Group Management', () => {
    test('should display empty state when no groups exist', async ({ adminPage }) => {
      // Should show empty state message
      await expect(adminPage.getByText(/no groups or subjects yet/i)).toBeVisible();
    });

    test('should open create group dialog', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: /create group/i }).click();

      // Check dialog is visible
      await expect(adminPage.getByRole('heading', { name: /create project group/i })).toBeVisible();

      // Check form fields
      await expect(adminPage.getByLabel(/group name/i)).toBeVisible();
      await expect(adminPage.getByLabel(/description/i)).toBeVisible();

      // Check buttons
      await expect(adminPage.getByRole('button', { name: /cancel/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /create group/i })).toBeVisible();
    });

    test('should create a new group successfully', async ({ adminPage }) => {
      const groupName = `Test Group ${Date.now()}`;
      const groupDescription = 'Group created by E2E test';

      // Open create group dialog
      await adminPage.getByRole('button', { name: /create group/i }).click();

      // Fill in the form
      await adminPage.getByLabel(/group name/i).fill(groupName);
      await adminPage.getByLabel(/description/i).fill(groupDescription);

      // Submit form
      await adminPage.getByRole('button', { name: /create group/i }).click();

      // Wait for dialog to close
      await expect(
        adminPage.getByRole('heading', { name: /create project group/i }),
      ).not.toBeVisible();

      // Verify group appears on page
      await expect(adminPage.getByRole('heading', { name: groupName, level: 3 })).toBeVisible();
      await expect(adminPage.getByText(groupDescription)).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /add subject/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /delete group/i })).toBeVisible();
    });

    test('should validate group name is required', async ({ adminPage }) => {
      // Open create group dialog
      await adminPage.getByRole('button', { name: /create group/i }).click();

      // Try to submit without filling name
      const createButton = adminPage.getByRole('button', { name: /create group/i });

      // Button should be disabled when name is empty
      await expect(createButton).toBeDisabled();

      // Fill name
      await adminPage.getByLabel(/group name/i).fill('Test Group');

      // Now button should be enabled (description is optional)
      await expect(createButton).toBeEnabled();
    });

    test('should create multiple groups', async ({ adminPage }) => {
      const groups = [
        { name: 'Backend Services', description: 'API and database' },
        { name: 'Frontend Application', description: 'UI components' },
        { name: 'Infrastructure', description: 'DevOps and deployment' },
      ];

      for (const group of groups) {
        await adminPage.getByRole('button', { name: /create group/i }).click();
        await adminPage.getByLabel(/group name/i).fill(group.name);
        await adminPage.getByLabel(/description/i).fill(group.description);
        await adminPage.getByRole('button', { name: /create group/i }).click();
        await adminPage.waitForTimeout(500);
      }

      // Verify all groups are visible
      for (const group of groups) {
        await expect(adminPage.getByRole('heading', { name: group.name, level: 3 })).toBeVisible();
      }
    });

    test('should delete group with confirmation', async ({ adminPage }) => {
      const groupName = `Delete Group ${Date.now()}`;

      // Create a group first
      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.getByLabel(/group name/i).fill(groupName);
      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.waitForTimeout(500);

      // Set up dialog handler
      adminPage.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain(groupName);
        await dialog.accept();
      });

      // Find the group card and click delete
      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: groupName });
      await groupCard.getByRole('button', { name: /delete group/i }).click();

      // Wait for deletion
      await adminPage.waitForTimeout(1000);

      // Group should no longer be visible
      await expect(adminPage.getByRole('heading', { name: groupName, level: 3 })).not.toBeVisible();
    });
  });

  test.describe('Subject Management', () => {
    test.beforeEach(async ({ adminPage }) => {
      // Create a group for subject tests
      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.getByLabel(/group name/i).fill('Test Group for Subjects');
      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.waitForTimeout(500);
    });

    test('should show empty state for group with no subjects', async ({ adminPage }) => {
      await expect(adminPage.getByText(/no subjects in this group/i)).toBeVisible();
    });

    test('should open create subject dialog for group', async ({ adminPage }) => {
      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: 'Test Group for Subjects' });

      await groupCard.getByRole('button', { name: /add subject/i }).click();

      // Check dialog is visible
      await expect(adminPage.getByRole('heading', { name: /create subject/i })).toBeVisible();
      await expect(
        adminPage.getByText(/create a subject within the selected group/i),
      ).toBeVisible();

      // Check form fields
      await expect(adminPage.getByLabel(/subject name/i)).toBeVisible();
      await expect(adminPage.getByLabel(/description/i)).toBeVisible();
    });

    test('should create subject within group', async ({ adminPage }) => {
      const subjectName = `Test Subject ${Date.now()}`;
      const subjectDescription = 'Subject created by E2E test';

      // Open add subject dialog from group
      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: 'Test Group for Subjects' });

      await groupCard.getByRole('button', { name: /add subject/i }).click();

      // Fill in the form
      await adminPage.getByLabel(/subject name/i).fill(subjectName);
      await adminPage.getByLabel(/description/i).fill(subjectDescription);

      // Submit form
      await adminPage.getByRole('button', { name: /create subject/i }).click();

      // Wait for dialog to close
      await expect(adminPage.getByRole('heading', { name: /create subject/i })).not.toBeVisible();

      // Verify subject appears in group
      await expect(groupCard.getByText(subjectName)).toBeVisible();
      await expect(groupCard.getByText(subjectDescription)).toBeVisible();

      // Should not show empty state anymore
      await expect(adminPage.getByText(/no subjects in this group/i)).not.toBeVisible();
    });

    test('should create multiple subjects in group', async ({ adminPage }) => {
      const subjects = [
        { name: 'User Authentication', description: 'Login and registration' },
        { name: 'Data Validation', description: 'Input validation rules' },
        { name: 'Error Handling', description: 'Error management' },
      ];

      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: 'Test Group for Subjects' });

      for (const subject of subjects) {
        await groupCard.getByRole('button', { name: /add subject/i }).click();
        await adminPage.getByLabel(/subject name/i).fill(subject.name);
        await adminPage.getByLabel(/description/i).fill(subject.description);
        await adminPage.getByRole('button', { name: /create subject/i }).click();
        await adminPage.waitForTimeout(500);
      }

      // Verify all subjects are visible in the group
      for (const subject of subjects) {
        await expect(groupCard.getByText(subject.name)).toBeVisible();
      }
    });

    test('should create top-level subject (not in group)', async ({ adminPage }) => {
      const subjectName = `Top Level Subject ${Date.now()}`;
      const subjectDescription = 'Cross-cutting concern';

      // Open create top-level subject dialog
      await adminPage.getByRole('button', { name: /create top-level subject/i }).click();

      // Check dialog message
      await expect(
        adminPage.getByText(/create a top-level subject \(not in a group\)/i),
      ).toBeVisible();

      // Fill in the form
      await adminPage.getByLabel(/subject name/i).fill(subjectName);
      await adminPage.getByLabel(/description/i).fill(subjectDescription);

      // Submit form
      await adminPage.getByRole('button', { name: /create subject/i }).click();

      // Wait for dialog to close
      await adminPage.waitForTimeout(500);

      // Verify subject appears in top-level subjects section
      const topLevelSection = adminPage.locator('.rounded-lg.border.bg-white').filter({
        hasText: /top-level subjects/i,
      });

      await expect(topLevelSection.getByText(subjectName)).toBeVisible();
      await expect(topLevelSection.getByText(subjectDescription)).toBeVisible();
    });

    test('should delete subject from group', async ({ adminPage }) => {
      const subjectName = `Delete Subject ${Date.now()}`;

      // Create a subject first
      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: 'Test Group for Subjects' });

      await groupCard.getByRole('button', { name: /add subject/i }).click();
      await adminPage.getByLabel(/subject name/i).fill(subjectName);
      await adminPage.getByRole('button', { name: /create subject/i }).click();
      await adminPage.waitForTimeout(500);

      // Set up dialog handler
      adminPage.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain(subjectName);
        await dialog.accept();
      });

      // Find subject card and click delete
      const subjectCard = groupCard.locator('.rounded.border.p-2').filter({ hasText: subjectName });
      await subjectCard.getByRole('button', { name: /delete/i }).click();

      // Wait for deletion
      await adminPage.waitForTimeout(1000);

      // Subject should no longer be visible
      await expect(groupCard.getByText(subjectName)).not.toBeVisible();
    });

    test('should validate subject name is required', async ({ adminPage }) => {
      // Open create subject dialog
      await adminPage.getByRole('button', { name: /create top-level subject/i }).click();

      // Try to submit without filling name
      const createButton = adminPage.getByRole('button', { name: /create subject/i });

      // Button should be disabled when name is empty
      await expect(createButton).toBeDisabled();

      // Fill name
      await adminPage.getByLabel(/subject name/i).fill('Test Subject');

      // Now button should be enabled (description is optional)
      await expect(createButton).toBeEnabled();
    });
  });

  test.describe('Complete Hierarchy', () => {
    test('should create complete project hierarchy', async ({ adminPage }) => {
      // Create multiple groups with subjects
      const hierarchy = [
        {
          group: 'Authentication',
          subjects: ['User Login', 'Password Reset', 'Two-Factor Auth'],
        },
        {
          group: 'Data Management',
          subjects: ['CRUD Operations', 'Data Validation', 'Data Export'],
        },
      ];

      // Create groups and subjects
      for (const item of hierarchy) {
        // Create group
        await adminPage.getByRole('button', { name: /create group/i }).click();
        await adminPage.getByLabel(/group name/i).fill(item.group);
        await adminPage.getByRole('button', { name: /create group/i }).click();
        await adminPage.waitForTimeout(500);

        // Add subjects to group
        const groupCard = adminPage
          .locator('.rounded-lg.border.bg-white')
          .filter({ hasText: item.group });

        for (const subject of item.subjects) {
          await groupCard.getByRole('button', { name: /add subject/i }).click();
          await adminPage.getByLabel(/subject name/i).fill(subject);
          await adminPage.getByRole('button', { name: /create subject/i }).click();
          await adminPage.waitForTimeout(500);
        }
      }

      // Create top-level subjects
      const topLevelSubjects = ['Performance Requirements', 'Security Guidelines'];

      for (const subject of topLevelSubjects) {
        await adminPage.getByRole('button', { name: /create top-level subject/i }).click();
        await adminPage.getByLabel(/subject name/i).fill(subject);
        await adminPage.getByRole('button', { name: /create subject/i }).click();
        await adminPage.waitForTimeout(500);
      }

      // Verify complete hierarchy is visible
      for (const item of hierarchy) {
        const groupCard = adminPage
          .locator('.rounded-lg.border.bg-white')
          .filter({ hasText: item.group });

        await expect(groupCard).toBeVisible();

        for (const subject of item.subjects) {
          await expect(groupCard.getByText(subject)).toBeVisible();
        }
      }

      // Verify top-level subjects
      const topLevelSection = adminPage.locator('.rounded-lg.border.bg-white').filter({
        hasText: /top-level subjects/i,
      });

      for (const subject of topLevelSubjects) {
        await expect(topLevelSection.getByText(subject)).toBeVisible();
      }
    });

    test('should persist hierarchy after page refresh', async ({ adminPage }) => {
      // Create a group with subject
      const groupName = 'Persistent Group';
      const subjectName = 'Persistent Subject';

      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.getByLabel(/group name/i).fill(groupName);
      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.waitForTimeout(500);

      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: groupName });

      await groupCard.getByRole('button', { name: /add subject/i }).click();
      await adminPage.getByLabel(/subject name/i).fill(subjectName);
      await adminPage.getByRole('button', { name: /create subject/i }).click();
      await adminPage.waitForTimeout(500);

      // Refresh the page
      await adminPage.reload();
      await adminPage.waitForLoadState('networkidle');

      // Verify hierarchy is still visible
      await expect(adminPage.getByRole('heading', { name: groupName, level: 3 })).toBeVisible();

      const refreshedGroupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: groupName });

      await expect(refreshedGroupCard.getByText(subjectName)).toBeVisible();
    });

    test('should move subjects to top-level when group is deleted', async ({ adminPage }) => {
      // Create a group with multiple subjects
      const timestamp = Date.now();
      const groupName = `Cascade Delete ${timestamp}`;

      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.getByLabel(/group name/i).fill(groupName);
      await adminPage.getByRole('button', { name: /create group/i }).click();
      await adminPage.waitForTimeout(500);

      const groupCard = adminPage
        .locator('.rounded-lg.border.bg-white')
        .filter({ hasText: groupName });

      // Add subjects with unique names
      const subjects = [
        `Subject 1-${timestamp}`,
        `Subject 2-${timestamp}`,
        `Subject 3-${timestamp}`,
      ];
      for (const subject of subjects) {
        await groupCard.getByRole('button', { name: /add subject/i }).click();
        await adminPage.getByLabel(/subject name/i).fill(subject);
        await adminPage.getByRole('button', { name: /create subject/i }).click();
        await adminPage.waitForTimeout(300);
      }

      // Set up dialog handler
      adminPage.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Delete the group
      await groupCard.getByRole('button', { name: /delete group/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify group is gone
      await expect(adminPage.getByRole('heading', { name: groupName, level: 3 })).not.toBeVisible();

      // Verify subjects are moved to top-level (not deleted - this prevents data loss)
      const topLevelSection = adminPage.locator('text=Top-Level Subjects').locator('..');
      for (const subject of subjects) {
        await expect(topLevelSection.getByText(subject)).toBeVisible();
      }
    });
  });
});
