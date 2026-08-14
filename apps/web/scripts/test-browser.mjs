import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import process from 'node:process';

import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const environment = {
  ...process.env,
  NEXT_PUBLIC_APP_NAME: 'Proprium',
  NEXT_PUBLIC_APP_VERSION: 'browser',
  NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8080',
  NEXT_PUBLIC_ENVIRONMENT: 'test',
};
const server = spawn(
  process.execPath,
  [
    './node_modules/next/dist/bin/next',
    'dev',
    '--hostname',
    '127.0.0.1',
    '--port',
    '3100',
  ],
  { env: environment, stdio: 'inherit', windowsHide: true },
);
const baseUrl = 'http://127.0.0.1:3100';

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error('The browser test server exited before becoming ready.');
    try {
      if ((await fetch(`${baseUrl}/login`)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for the browser test server.');
}

function terminateServer() {
  if (!server.pid || server.exitCode !== null) return;
  if (process.platform === 'win32') {
    const cleanup = spawn(
      'taskkill',
      ['/pid', String(server.pid), '/T', '/F'],
      {
        stdio: 'ignore',
        windowsHide: true,
        detached: true,
      },
    );
    cleanup.unref();
  } else server.kill('SIGTERM');
}

async function check(condition, message) {
  assert.ok(await condition, message);
}

let browser;
let exitCode = 0;
try {
  await waitForServer();

  const opaqueCookie = 'proprium_session=opaque-session-value';
  const protectedHtml = await fetch(`${baseUrl}/dashboard`, {
    headers: { cookie: opaqueCookie },
  });
  const protectedHtmlBody = await protectedHtml.text();
  assert.equal(
    protectedHtml.status,
    200,
    'Admitted protected HTML did not render.',
  );
  assert.match(
    protectedHtmlBody,
    /Resolving your session/,
    'Protected HTML did not render the neutral resolution frame.',
  );
  assert.doesNotMatch(
    protectedHtmlBody,
    /Welcome,|Dashboard/,
    'Protected HTML included route content before authentication.',
  );

  const protectedRsc = await fetch(`${baseUrl}/dashboard`, {
    headers: { cookie: opaqueCookie, RSC: '1' },
  });
  const protectedRscBody = await protectedRsc.text();
  assert.doesNotMatch(
    protectedRscBody,
    /Welcome,|Dashboard/,
    'Protected RSC output included route content before authentication.',
  );

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await context.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 401 }),
  );
  const page = await context.newPage();

  await page.goto(`${baseUrl}/dashboard?tab=recent`);
  await page.getByRole('heading', { name: 'Sign in' }).waitFor();
  assert.match(page.url(), /\/login\?returnTo=%2Fdashboard%3Ftab%3Drecent$/);
  await check(
    page
      .getByText('Dashboard')
      .count()
      .then((count) => count === 0),
    'Protected content rendered before authentication.',
  );

  const authenticatedContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  // Inject the non-production opaque cookie header for admission-path checks;
  // mocked identity resolution remains the authentication authority.
  await authenticatedContext.setExtraHTTPHeaders({
    cookie: 'proprium_session=opaque-session-value',
  });
  let releaseIdentity;
  const identityReady = new Promise((resolve) => {
    releaseIdentity = resolve;
  });
  let identityRequests = 0;
  await authenticatedContext.route('**/api/v1/auth/me', async (route) => {
    identityRequests += 1;
    if (identityRequests === 1) {
      await identityReady;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          username: 'operator',
          displayName: 'Operator',
          roles: [],
          permissions: ['application.authenticated.access'],
        }),
      });
      return;
    }
    await route.fulfill({ status: 401 });
  });
  await authenticatedContext.route('**/api/v1/auth/logout', (route) =>
    route.fulfill({ status: 204 }),
  );
  const authenticatedPage = await authenticatedContext.newPage();
  await authenticatedPage.goto(`${baseUrl}/dashboard`, {
    waitUntil: 'domcontentloaded',
  });
  await authenticatedPage.getByText('Resolving your session…').waitFor();
  await check(
    authenticatedPage
      .getByRole('heading', { name: 'Dashboard' })
      .count()
      .then((count) => count === 0),
    'Protected content mounted before delayed identity validation.',
  );
  releaseIdentity();
  await authenticatedPage.getByRole('heading', { name: 'Dashboard' }).waitFor();
  await check(
    authenticatedPage.getByLabel('Application sidebar').isVisible(),
    'Desktop sidebar was not visible at 1280px.',
  );
  await check(
    authenticatedPage
      .getByRole('button', { name: 'Open navigation' })
      .isHidden(),
    'Mobile trigger remained visible at the desktop breakpoint.',
  );
  await check(
    authenticatedPage
      .getByRole('link', { name: 'Dashboard' })
      .getAttribute('aria-current')
      .then((value) => value === 'page'),
    'Dashboard navigation did not expose current-page semantics.',
  );
  await authenticatedPage
    .getByRole('button', { name: 'Collapse sidebar' })
    .click();
  await check(
    authenticatedPage
      .locator('.shell')
      .getAttribute('data-sidebar')
      .then((value) => value === 'collapsed'),
    'Desktop sidebar did not enter collapsed state.',
  );
  await authenticatedPage.setViewportSize({ width: 320, height: 800 });
  const mobileTrigger = authenticatedPage.getByRole('button', {
    name: 'Open navigation',
  });
  await mobileTrigger.waitFor();
  await check(
    authenticatedPage.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
    'Application shell overflowed at 320px.',
  );
  await mobileTrigger.click();
  await authenticatedPage.getByRole('dialog', { name: 'Navigation' }).waitFor();
  await check(
    authenticatedPage
      .getByRole('button', { name: 'Close navigation' })
      .evaluate((element) => element === document.activeElement),
    'Mobile drawer did not move focus to its close control.',
  );
  await authenticatedPage.keyboard.press('Escape');
  await check(
    mobileTrigger.evaluate((element) => element === document.activeElement),
    'Mobile drawer did not return focus after Escape.',
  );
  await authenticatedPage.setViewportSize({ width: 1280, height: 900 });
  await authenticatedPage
    .getByRole('button', { name: 'Open user menu' })
    .click();
  const signedOut = authenticatedPage.waitForURL('**/login*', {
    waitUntil: 'commit',
  });
  await authenticatedPage.getByText('Sign out', { exact: true }).click();
  await signedOut;
  await authenticatedPage.goBack();
  assert.doesNotMatch(
    authenticatedPage.url(),
    /\/dashboard/,
    'Browser back navigation revisited the protected route after logout.',
  );
  await check(
    authenticatedPage
      .getByRole('heading', { name: 'Dashboard' })
      .count()
      .then((count) => count === 0),
    'Browser back navigation restored protected content after logout.',
  );
  await authenticatedContext.close();

  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${baseUrl}/login`);
    await check(
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
      `Login overflowed at ${width}px.`,
    );
  }

  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await check(
    page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
    'Login overflowed at 200% text scaling.',
  );

  await page.goto(`${baseUrl}/login`);
  const password = page.getByLabel('Password *');
  await password.fill('not-a-real-password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await check(
    password.getAttribute('type').then((type) => type === 'text'),
    'Password was not revealed.',
  );
  await check(
    password.inputValue().then((value) => value === 'not-a-real-password'),
    'Password value changed when visibility changed.',
  );
  await page.getByRole('button', { name: 'Hide password' }).click();
  await check(
    password.getAttribute('type').then((type) => type === 'password'),
    'Password was not remasked.',
  );

  await context.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 401 }),
  );
  await page.getByLabel('Username *').fill('unknown-user');
  await password.fill('synthetic-invalid-password');
  await password.press('Enter');
  const loginError = page.locator('#login-error');
  await loginError.waitFor();
  await check(
    loginError
      .textContent()
      .then((text) => text?.includes('those credentials')),
    'Invalid credentials did not produce the generic authentication error.',
  );
  await check(
    loginError
      .textContent()
      .then((text) => !text?.includes('synthetic-invalid-password')),
    'Invalid-credential feedback exposed the submitted password.',
  );
  await context.unroute('**/api/v1/auth/login');
  await context.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 429 }),
  );
  await password.press('Enter');
  await check(
    loginError
      .textContent()
      .then((text) => text?.includes('Too many sign-in attempts')),
    'Rate limiting did not produce safe retry guidance.',
  );
  await context.unroute('**/api/v1/auth/login');

  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  assert.deepEqual(
    serious,
    [],
    'Login has serious or critical Axe violations.',
  );

  const expiredContext = await browser.newContext({
    extraHTTPHeaders: {
      cookie: 'proprium_session=invalid-opaque-session',
    },
  });
  await expiredContext.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 401 }),
  );
  const expiredPage = await expiredContext.newPage();
  await expiredPage.goto(`${baseUrl}/dashboard`, {
    waitUntil: 'domcontentloaded',
  });
  await expiredPage.getByRole('heading', { name: 'Sign in' }).waitFor();
  await check(
    expiredPage
      .getByRole('heading', { name: 'Dashboard' })
      .count()
      .then((count) => count === 0),
    'An invalid admitted cookie exposed protected content before redirect.',
  );
  await expiredContext.close();

  const loginContext = await browser.newContext({
    extraHTTPHeaders: {
      cookie: 'proprium_session=opaque-session-value',
    },
  });
  let loginIdentityRequests = 0;
  await loginContext.route('**/api/v1/auth/me', (route) => {
    loginIdentityRequests += 1;
    return loginIdentityRequests === 1
      ? route.fulfill({ status: 401 })
      : route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-2',
            username: 'login-operator',
            displayName: 'Login Operator',
            roles: [],
            permissions: ['application.authenticated.access'],
          }),
        });
  });
  await loginContext.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 204 }),
  );
  const loginPage = await loginContext.newPage();
  await loginPage.goto(`${baseUrl}/login?returnTo=%2Fdashboard`);
  await loginPage.getByRole('heading', { name: 'Sign in' }).waitFor();
  await loginPage.getByLabel('Username *').fill('login-operator');
  await loginPage.getByLabel('Password *').fill('synthetic-valid-password');
  await loginPage.getByLabel('Password *').press('Enter');
  await loginPage.getByRole('heading', { name: 'Dashboard' }).waitFor();
  await check(
    Promise.resolve(loginPage.url().endsWith('/dashboard')),
    'Successful login did not reach the safe protected destination.',
  );
  await loginContext.close();

  console.log('Browser certification checks passed: 29 assertions.');
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  await browser?.close();
  terminateServer();
}
process.exit(exitCode);
