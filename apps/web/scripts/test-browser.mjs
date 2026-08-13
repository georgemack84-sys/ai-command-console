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

  const opaqueCookie = '__Host-proprium_session=opaque-session-value';
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
  // Chromium correctly refuses insecure __Host- cookies. The local harness is
  // HTTP, so inject the opaque header only for these admission-path checks.
  await authenticatedContext.setExtraHTTPHeaders({
    cookie: '__Host-proprium_session=opaque-session-value',
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

  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  assert.deepEqual(
    serious,
    [],
    'Login has serious or critical Axe violations.',
  );
  console.log('Browser certification checks passed: 14 assertions.');
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  await browser?.close();
  terminateServer();
}
process.exit(exitCode);
