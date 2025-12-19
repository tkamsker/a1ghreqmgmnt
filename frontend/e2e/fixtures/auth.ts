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
  // Listen to console messages
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[Browser ${type}]:`, msg.text());
    }
  });

  // Listen to network requests
  page.on('request', (request) => {
    if (request.url().includes('/graphql') && request.method() === 'POST') {
      console.log('🌐 GraphQL request:', request.postDataJSON());
    }
  });

  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();

    if (url.includes('/graphql')) {
      console.log(`🌐 GraphQL response: ${status}`);
      if (status >= 400) {
        try {
          const body = await response.text();
          console.log('Response body:', body);
        } catch (e) {
          // Ignore
        }
      }
    }

    // Log 404s for JavaScript files
    if (status === 404 && (url.includes('.js') || url.includes('_next'))) {
      console.log(`❌ 404: ${url}`);
    }
  });

  console.log('🔐 Starting login process...');
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.waitForURL('/login');
  console.log('✅ Navigated to login page');

  // Wait for React to hydrate (client-side JavaScript to be ready)
  console.log('⏳ Waiting for page to be interactive...');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Give React time to hydrate

  // Fill in login form
  console.log('📝 Filling email:', user.email);
  await page.getByLabel(/email/i).fill(user.email);
  console.log('📝 Filling password:', '***');
  await page.getByLabel(/password/i).fill(user.password);

  // Wait a moment for form to be ready
  await page.waitForTimeout(500);

  // Click login button
  console.log('🖱️  Clicking sign in button...');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait a moment for any navigation to start
  await page.waitForTimeout(2000);

  // Check current URL
  const currentUrl = page.url();
  console.log('📍 Current URL after login click:', currentUrl);

  // Check for error messages
  const errorElement = page.locator('.text-destructive');
  const hasError = await errorElement.isVisible().catch(() => false);
  if (hasError) {
    const errorText = await errorElement.textContent();
    console.error('❌ Login error:', errorText);
  }

  // Wait for redirect to dashboard
  console.log('⏳ Waiting for redirect to dashboard...');
  await page.waitForURL('/dashboard', { timeout: 10000 });
  console.log('✅ Successfully logged in and redirected to dashboard');
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
