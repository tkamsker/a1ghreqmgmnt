import { test, expect } from './fixtures/auth';

test.describe('Requirements Management', () => {
  let projectCode: string;
  let subjectName: string;

  test.beforeEach(async ({ adminPage }) => {
    // Create a test project with a subject for requirements tests
    await adminPage.goto('/projects');
    await adminPage.waitForLoadState('networkidle');

    const timestamp = Date.now();
    projectCode = `REQ-${timestamp}`;

    // Create project
    await adminPage.getByRole('button', { name: /create project/i }).click();
    await adminPage.getByLabel(/project code/i).fill(projectCode);
    await adminPage.getByLabel(/project name/i).fill('Requirements Test Project');
    await adminPage.getByRole('button', { name: /^create project$/i }).click();
    await adminPage.waitForTimeout(1000);

    // Navigate to project detail page
    const row = adminPage.getByRole('row').filter({ hasText: projectCode });
    await row.getByRole('button', { name: /view/i }).click();
    await adminPage.waitForLoadState('networkidle');

    // Create a subject to attach requirements to
    subjectName = `Test Subject ${timestamp}`;
    await adminPage.getByRole('button', { name: /create subject/i }).click();
    await adminPage.getByLabel(/subject name/i).fill(subjectName);
    await adminPage.getByLabel(/description/i).fill('Subject for requirements testing');
    await adminPage.getByRole('button', { name: /^create subject$/i }).click();
    await adminPage.waitForTimeout(1000);
  });

  test.describe('Requirement CRUD Operations', () => {
    test('should create a new requirement with all fields', async ({ adminPage }) => {
      const requirementTitle = `Test Requirement ${Date.now()}`;
      const requirementStatement = 'This is a test requirement statement';
      const requirementRationale = 'This requirement is needed for testing purposes';

      // Click Add Requirement button for the subject
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();

      // Fill in requirement form
      await expect(adminPage.getByRole('heading', { name: /^create requirement$/i })).toBeVisible();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill(requirementStatement);
      await adminPage.getByLabel(/rationale/i).fill(requirementRationale);
      await adminPage.getByLabel(/priority/i).clear();
      await adminPage.getByLabel(/priority/i).fill('1');

      // Create requirement
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify requirement appears in the list
      await expect(adminPage.getByText(requirementTitle)).toBeVisible();
      await expect(adminPage.getByText(/REQ-\d{4}/)).toBeVisible();
      await expect(adminPage.getByText(/draft/i)).toBeVisible();
    });

    test('should view requirement details', async ({ adminPage }) => {
      // Create a requirement first
      const requirementTitle = `Detail Test Requirement ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Test statement for detail view');
      await adminPage.getByLabel(/rationale/i).fill('Test rationale');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Click View button
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('button', { name: /^view$/i }).click();
      await adminPage.waitForLoadState('networkidle');

      // Verify requirement detail page
      await expect(adminPage.getByText(/REQ-\d{4}/)).toBeVisible();
      await expect(adminPage.getByText(requirementTitle)).toBeVisible();
      await expect(adminPage.getByText(/test statement for detail view/i)).toBeVisible();
      await expect(adminPage.getByText(/test rationale/i)).toBeVisible();
      await expect(adminPage.getByText(/version 1/i)).toBeVisible();
      await expect(adminPage.getByText(/version history/i)).toBeVisible();
    });

    test('should edit requirement and create new version', async ({ adminPage }) => {
      // Create a requirement first
      const requirementTitle = `Edit Test Requirement ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Original statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Click Edit button
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('button', { name: /^edit$/i }).click();

      // Verify edit dialog shows version information
      await expect(adminPage.getByRole('heading', { name: /edit requirement/i })).toBeVisible();
      await expect(adminPage.getByText(/current version: v1/i)).toBeVisible();
      await expect(adminPage.getByText(/this edit will create version 2/i)).toBeVisible();

      // Update requirement
      const updatedTitle = `${requirementTitle} - Updated`;
      await adminPage.getByLabel(/title \*/i).clear();
      await adminPage.getByLabel(/title \*/i).fill(updatedTitle);
      await adminPage.getByLabel(/statement \*/i).clear();
      await adminPage.getByLabel(/statement \*/i).fill('Updated statement');
      await adminPage.getByLabel(/delta notes/i).fill('Updated title and statement');

      await adminPage.getByRole('button', { name: /save new version/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify updated requirement appears
      await expect(adminPage.getByText(updatedTitle)).toBeVisible();
    });

    test('should delete a requirement', async ({ adminPage }) => {
      // Create a requirement first
      const requirementTitle = `Delete Test Requirement ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Statement to be deleted');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Click Delete button and confirm
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('button', { name: /^delete$/i }).click();

      // Handle confirmation dialog
      adminPage.on('dialog', (dialog) => dialog.accept());
      await adminPage.waitForTimeout(1000);

      // Verify requirement is removed
      await expect(adminPage.getByText(requirementTitle)).not.toBeVisible();
    });
  });

  test.describe('Requirement Versioning', () => {
    test('should display version history with delta notes', async ({ adminPage }) => {
      // Create a requirement
      const requirementTitle = `Version History Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Version 1 statement');
      await adminPage.getByLabel(/rationale/i).fill('Initial rationale');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Edit to create version 2
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('button', { name: /^edit$/i }).click();
      await adminPage.getByLabel(/statement \*/i).clear();
      await adminPage.getByLabel(/statement \*/i).fill('Version 2 statement');
      await adminPage.getByLabel(/delta notes/i).fill('Changed statement text');
      await adminPage.getByRole('button', { name: /save new version/i }).click();
      await adminPage.waitForTimeout(1000);

      // Edit to create version 3
      await requirementRow.getByRole('button', { name: /^edit$/i }).click();
      await adminPage.getByLabel(/statement \*/i).clear();
      await adminPage.getByLabel(/statement \*/i).fill('Version 3 statement');
      await adminPage.getByLabel(/delta notes/i).fill('Changed statement again');
      await adminPage.getByRole('button', { name: /save new version/i }).click();
      await adminPage.waitForTimeout(1000);

      // View requirement detail page
      await requirementRow.getByRole('button', { name: /^view$/i }).click();
      await adminPage.waitForLoadState('networkidle');

      // Verify version history section
      await expect(adminPage.getByText(/version history/i)).toBeVisible();
      await expect(adminPage.getByText(/3 versions total/i)).toBeVisible();

      // Verify all versions are displayed
      await expect(adminPage.getByText(/version 3/i)).toBeVisible();
      await expect(adminPage.getByText(/version 2/i)).toBeVisible();
      await expect(adminPage.getByText(/version 1/i)).toBeVisible();

      // Verify delta notes are shown
      await expect(adminPage.getByText(/changed statement text/i)).toBeVisible();
      await expect(adminPage.getByText(/changed statement again/i)).toBeVisible();

      // Verify current version badge
      await expect(adminPage.getByText(/current/i).first()).toBeVisible();
    });

    test('should show version number increments correctly', async ({ adminPage }) => {
      // Create a requirement
      const requirementTitle = `Version Increment Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Initial statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Edit - should show v1 -> v2
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('button', { name: /^edit$/i }).click();
      await expect(adminPage.getByText(/current version: v1/i)).toBeVisible();
      await expect(adminPage.getByText(/this edit will create version 2/i)).toBeVisible();
      await adminPage.getByRole('button', { name: /cancel/i }).click();

      // Make first edit
      await requirementRow.getByRole('button', { name: /^edit$/i }).click();
      await adminPage.getByLabel(/statement \*/i).clear();
      await adminPage.getByLabel(/statement \*/i).fill('Second version');
      await adminPage.getByRole('button', { name: /save new version/i }).click();
      await adminPage.waitForTimeout(1000);

      // Edit again - should show v2 -> v3
      await requirementRow.getByRole('button', { name: /^edit$/i }).click();
      await expect(adminPage.getByText(/current version: v2/i)).toBeVisible();
      await expect(adminPage.getByText(/this edit will create version 3/i)).toBeVisible();
    });
  });

  test.describe('Sub-requirements and Hierarchy', () => {
    test('should create a sub-requirement', async ({ adminPage }) => {
      // Create a parent requirement first
      const parentTitle = `Parent Requirement ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(parentTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Parent requirement statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Click "+ Sub" button to create sub-requirement
      const parentRow = adminPage.locator('div').filter({ hasText: parentTitle });
      await parentRow.getByRole('button', { name: /\+ sub/i }).click();

      // Verify dialog shows it's a sub-requirement
      await expect(
        adminPage.getByRole('heading', { name: /create sub-requirement/i }),
      ).toBeVisible();
      await expect(
        adminPage.getByText(/this requirement will be linked to the selected parent/i),
      ).toBeVisible();

      // Create sub-requirement
      const subTitle = `Sub-requirement ${Date.now()}`;
      await adminPage.getByLabel(/title \*/i).fill(subTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Sub-requirement statement');
      await adminPage.getByRole('button', { name: /create/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify sub-requirement appears indented under parent
      await expect(adminPage.getByText(subTitle)).toBeVisible();
      await expect(adminPage.getByText(/\(1 sub\)/i)).toBeVisible();
    });

    test('should display sub-requirements with visual hierarchy', async ({ adminPage }) => {
      // Create parent requirement
      const parentTitle = `Hierarchy Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(parentTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Parent statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Create first sub-requirement
      const parentRow = adminPage.locator('div').filter({ hasText: parentTitle });
      await parentRow.getByRole('button', { name: /\+ sub/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(`Sub 1 ${Date.now()}`);
      await adminPage.getByLabel(/statement \*/i).fill('Sub 1 statement');
      await adminPage.getByRole('button', { name: /create/i }).click();
      await adminPage.waitForTimeout(1000);

      // Create second sub-requirement
      await parentRow.getByRole('button', { name: /\+ sub/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(`Sub 2 ${Date.now()}`);
      await adminPage.getByLabel(/statement \*/i).fill('Sub 2 statement');
      await adminPage.getByRole('button', { name: /create/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify parent shows count of sub-requirements
      await expect(adminPage.getByText(/\(2 sub\)/i)).toBeVisible();
    });

    test('should navigate to parent requirement from sub-requirement detail page', async ({
      adminPage,
    }) => {
      // Create parent and sub-requirement
      const parentTitle = `Nav Parent ${Date.now()}`;
      const subTitle = `Nav Sub ${Date.now()}`;

      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(parentTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Parent statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      const parentRow = adminPage.locator('div').filter({ hasText: parentTitle });
      await parentRow.getByRole('button', { name: /\+ sub/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(subTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Sub statement');
      await adminPage.getByRole('button', { name: /create/i }).click();
      await adminPage.waitForTimeout(1000);

      // Navigate to sub-requirement detail page
      const subRow = adminPage.locator('div').filter({ hasText: subTitle });
      await subRow.getByRole('button', { name: /^view$/i }).click();
      await adminPage.waitForLoadState('networkidle');

      // Verify parent requirement link is shown
      await expect(adminPage.getByText(/parent requirement/i)).toBeVisible();
      await expect(adminPage.getByText(parentTitle)).toBeVisible();
    });
  });

  test.describe('Requirement Status Workflow', () => {
    test('should change requirement status from DRAFT to REVIEW', async ({ adminPage }) => {
      // Create a requirement
      const requirementTitle = `Status Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Status test statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify initial status is DRAFT
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await expect(requirementRow.getByText(/draft/i)).toBeVisible();

      // Change status to REVIEW
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /review/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify status changed
      await expect(requirementRow.getByText(/review/i)).toBeVisible();
    });

    test('should change requirement status to APPROVED', async ({ adminPage }) => {
      // Create a requirement
      const requirementTitle = `Approval Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Approval test statement');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Change to REVIEW first
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /review/i }).click();
      await adminPage.waitForTimeout(1000);

      // Change to APPROVED
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /approved/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify status is APPROVED
      await expect(requirementRow.getByText(/approved/i)).toBeVisible();
    });

    test('should change status on requirement detail page', async ({ adminPage }) => {
      // Create a requirement
      const requirementTitle = `Detail Status Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('Detail status test');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      // Navigate to detail page
      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });
      await requirementRow.getByRole('button', { name: /^view$/i }).click();
      await adminPage.waitForLoadState('networkidle');

      // Change status on detail page
      await adminPage.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /approved/i }).click();
      await adminPage.waitForTimeout(1000);

      // Verify status changed
      await expect(adminPage.getByText(/approved/i)).toBeVisible();

      // Go back to project page and verify status persisted
      await adminPage.getByRole('button', { name: /← back/i }).click();
      await adminPage.waitForLoadState('networkidle');
      await expect(requirementRow.getByText(/approved/i)).toBeVisible();
    });

    test('should support all status transitions', async ({ adminPage }) => {
      // Create a requirement
      const requirementTitle = `All Status Test ${Date.now()}`;
      const subjectSection = adminPage.locator('div').filter({ hasText: subjectName }).first();
      await subjectSection.getByRole('button', { name: /add requirement/i }).click();
      await adminPage.getByLabel(/title \*/i).fill(requirementTitle);
      await adminPage.getByLabel(/statement \*/i).fill('All status test');
      await adminPage.getByRole('button', { name: /create requirement/i }).click();
      await adminPage.waitForTimeout(1000);

      const requirementRow = adminPage.locator('div').filter({ hasText: requirementTitle });

      // Test DRAFT -> REVIEW
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /review/i }).click();
      await adminPage.waitForTimeout(500);
      await expect(requirementRow.getByText(/review/i)).toBeVisible();

      // Test REVIEW -> APPROVED
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /approved/i }).click();
      await adminPage.waitForTimeout(500);
      await expect(requirementRow.getByText(/approved/i)).toBeVisible();

      // Test APPROVED -> DEPRECATED
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /deprecated/i }).click();
      await adminPage.waitForTimeout(500);
      await expect(requirementRow.getByText(/deprecated/i)).toBeVisible();

      // Test DEPRECATED -> ARCHIVED
      await requirementRow.getByRole('combobox').click();
      await adminPage.getByRole('option', { name: /archived/i }).click();
      await adminPage.waitForTimeout(500);
      await expect(requirementRow.getByText(/archived/i)).toBeVisible();
    });
  });
});
