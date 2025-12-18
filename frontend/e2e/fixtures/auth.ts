import { test as base, Page } from '@playwright/test';

export type TestUser = {
  email: string;
  password: string;
  username: string;
  userType: string;
};

export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    username: 'admin',
    userType: 'SUPER_ADMIN',
  },
  contributor: {
    email: 'contributor@example.com',
    password: 'contributor123',
    username: 'contributor',
    userType: 'CONTRIBUTOR',
  },
} as const;

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.waitForURL('/login');

  // Fill in login form
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);

  // Click login button
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click user menu dropdown (shows user's name)
  await page
    .getByRole('button', { name: /admin|contributor/i })
    .first()
    .click();

  // Click "Log out" menu item
  await page.getByRole('menuitem', { name: /log out/i }).click();

  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await login(page, TEST_USERS.admin);

    // Use the authenticated page
    await use(page);

    // Cleanup
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await login(page, TEST_USERS.admin);

    // Use the admin page
    await use(page);

    // Cleanup
    await context.close();
  },
});

export { expect } from '@playwright/test';
