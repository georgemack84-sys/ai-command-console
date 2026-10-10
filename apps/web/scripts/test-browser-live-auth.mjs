import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import process from 'node:process';

import { chromium } from 'playwright';

const username = process.env.PROPRIUM_LIVE_AUTH_USERNAME;
const password = process.env.PROPRIUM_LIVE_AUTH_PASSWORD;
const apiBaseUrl =
  process.env.PROPRIUM_LIVE_API_BASE_URL ?? 'http://127.0.0.1:8080';
const baseUrl = 'http://127.0.0.1:3100';

if (!username || !password) {
  console.error(
    'Set PROPRIUM_LIVE_AUTH_USERNAME and PROPRIUM_LIVE_AUTH_PASSWORD to disposable development credentials.',
  );
  process.exit(1);
}

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
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_NAME: 'Proprium',
      NEXT_PUBLIC_APP_VERSION: 'live-auth-browser',
      NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
      NEXT_PUBLIC_ENVIRONMENT: 'development',
    },
    stdio: 'inherit',
    windowsHide: true,
  },
);

async function waitFor(url, label) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null)
      throw new Error('The browser test server exited before becoming ready.');
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}.`);
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

let assertionCount = 0;
async function check(condition, message) {
  assert.ok(await condition, message);
  assertionCount += 1;
}

let browser;
let exitCode = 0;
try {
  await waitFor(`${apiBaseUrl}/api/v1/health/ready`, 'the live API');
  await waitFor(`${baseUrl}/login`, 'the frontend');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__gp25ProtectedContentObserved = false;
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        const inspect = () => {
          if (document.body?.innerText.includes('Dashboard'))
            window.__gp25ProtectedContentObserved = true;
        };
        inspect();
        new MutationObserver(inspect).observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      },
      { once: true },
    );
  });

  await page.goto(`${baseUrl}/dashboard?tab=live`);
  await page.getByRole('heading', { name: 'Sign in' }).waitFor();
  await check(
    page.evaluate(() => !window.__gp25ProtectedContentObserved),
    'Protected content appeared before the live session check completed.',
  );
  await check(
    Promise.resolve(
      page.url().endsWith('/login?returnTo=%2Fdashboard%3Ftab%3Dlive'),
    ),
    'Unauthenticated direct access did not preserve the safe return path.',
  );

  await page.getByLabel('Username *').fill(username);
  await page.getByLabel('Password *').fill(`${password}-invalid`);
  const rejectedLogin = page.waitForResponse(
    (response) =>
      response.url() === `${apiBaseUrl}/api/v1/auth/login` &&
      response.request().method() === 'POST',
  );
  await page.getByLabel('Password *').press('Enter');
  await check(
    rejectedLogin.then((response) => response.status() === 401),
    'The real API did not reject invalid credentials with 401.',
  );
  await check(
    page
      .locator('#login-error')
      .textContent()
      .then((text) => text?.includes('those credentials')),
    'The live invalid-credential response did not produce the safe UI message.',
  );
  await check(
    context
      .cookies(apiBaseUrl)
      .then((cookies) => !cookies.some((cookie) => cookie.httpOnly)),
    'Rejected credentials unexpectedly issued an HttpOnly session cookie.',
  );

  await page.getByLabel('Password *').fill(password);
  const acceptedLogin = page.waitForResponse(
    (response) =>
      response.url() === `${apiBaseUrl}/api/v1/auth/login` &&
      response.request().method() === 'POST',
  );
  await page.getByLabel('Password *').press('Enter');
  await check(
    acceptedLogin.then((response) => response.status() === 204),
    'The real API did not accept valid credentials with 204.',
  );
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  await check(
    Promise.resolve(page.url().endsWith('/dashboard?tab=live')),
    'Successful live login did not restore the validated return path.',
  );

  const sessionCookie = (await context.cookies(apiBaseUrl)).find(
    (cookie) => cookie.name === 'proprium_session',
  );
  await check(
    Promise.resolve(
      sessionCookie?.httpOnly === true &&
        sessionCookie.secure === false &&
        sessionCookie.sameSite === 'Lax' &&
        sessionCookie.path === '/',
    ),
    'The development session cookie did not match the HttpOnly/Lax/path policy.',
  );
  await check(
    page.evaluate(
      () => localStorage.length === 0 && sessionStorage.length === 0,
    ),
    'Authentication data was written to browser storage.',
  );

  await page.reload();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  await check(
    page
      .getByRole('button', { name: 'Open user menu' })
      .textContent()
      .then((text) => text?.includes(username)),
    'Refresh did not restore the PostgreSQL-backed current user.',
  );

  await page.getByRole('button', { name: 'Open user menu' }).click();
  const logoutResponse = page.waitForResponse(
    (response) =>
      response.url() === `${apiBaseUrl}/api/v1/auth/logout` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await check(
    logoutResponse.then((response) => response.status() === 204),
    'The real API did not complete logout with 204.',
  );
  await page.getByRole('heading', { name: 'Sign in' }).waitFor();
  await check(
    context
      .cookies(apiBaseUrl)
      .then(
        (cookies) =>
          !cookies.some((cookie) => cookie.name === 'proprium_session'),
      ),
    'Logout did not clear the development session cookie.',
  );

  const replayContext = await browser.newContext();
  await replayContext.addCookies([
    {
      ...sessionCookie,
      value: sessionCookie.value,
      expires: -1,
    },
  ]);
  const replayPage = await replayContext.newPage();
  await replayPage.goto(`${baseUrl}/dashboard`);
  await replayPage.getByRole('heading', { name: 'Sign in' }).waitFor();
  await check(
    replayPage
      .getByRole('heading', { name: 'Dashboard' })
      .count()
      .then((count) => count === 0),
    'A revoked PostgreSQL session exposed protected content on replay.',
  );
  await replayContext.close();

  const onboardingContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const onboardingPage = await onboardingContext.newPage();
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const onboardingUsername = `onboarding-${suffix}`;
  const onboardingName = `Onboarding ${suffix}`;
  const renamedHousehold = `Home ${suffix}`;
  const billName = `Internet ${suffix}`;
  await onboardingPage.goto(`${baseUrl}/register`);
  await onboardingPage
    .getByRole('heading', { name: 'Create account' })
    .waitFor();
  await onboardingPage.getByLabel('Name *').fill(onboardingName);
  await onboardingPage.getByLabel('Username *').fill(onboardingUsername);
  await onboardingPage.getByLabel('Password *').fill('long-enough-password');
  const registrationResponse = onboardingPage.waitForResponse(
    (response) =>
      response.url() === `${apiBaseUrl}/api/v1/auth/register` &&
      response.request().method() === 'POST',
  );
  await onboardingPage.getByRole('button', { name: 'Create account' }).click();
  await check(
    registrationResponse.then((response) => response.status() === 204),
    'Account registration did not complete with 204.',
  );
  await onboardingPage
    .getByRole('heading', { name: `${onboardingName}'s household` })
    .waitFor();
  const householdPath = new URL(onboardingPage.url()).pathname;
  await check(
    Promise.resolve(/^\/households\/[0-9a-f-]+$/i.test(householdPath)),
    'Registration did not reach an explicit household route.',
  );

  await onboardingPage.getByLabel('Household name *').fill(renamedHousehold);
  const renameResponse = onboardingPage.waitForResponse(
    (response) =>
      response.url().endsWith(householdPath) &&
      response.request().method() === 'PATCH',
  );
  await onboardingPage.getByRole('button', { name: 'Save name' }).click();
  await check(
    renameResponse.then((response) => response.status() === 200),
    'Household rename did not complete with 200.',
  );
  await onboardingPage
    .getByRole('heading', { name: renamedHousehold })
    .waitFor();

  await onboardingPage.getByLabel('Bill name *').fill(billName);
  await onboardingPage.getByLabel('Amount *').fill('87.45');
  await onboardingPage.getByLabel('Due date *').fill('2030-01-15');
  const createBillResponse = onboardingPage.waitForResponse(
    (response) =>
      response.url().endsWith(`${householdPath}/bills`) &&
      response.request().method() === 'POST',
  );
  await onboardingPage.getByRole('button', { name: 'Add bill' }).click();
  await check(
    createBillResponse.then((response) => response.status() === 201),
    'First-bill creation did not complete with 201.',
  );
  await onboardingPage.getByText(billName, { exact: true }).waitFor();
  await onboardingPage.reload();
  await onboardingPage.getByText(billName, { exact: true }).waitFor();
  await check(
    onboardingPage
      .getByText('$87.45 · due 2030-01-15', { exact: true })
      .count()
      .then((count) => count === 1),
    'Refresh did not preserve the first bill.',
  );

  await onboardingPage.getByRole('button', { name: 'Open user menu' }).click();
  const onboardingLogout = onboardingPage.waitForResponse(
    (response) =>
      response.url() === `${apiBaseUrl}/api/v1/auth/logout` &&
      response.request().method() === 'POST',
  );
  await onboardingPage.getByRole('menuitem', { name: 'Sign out' }).click();
  await check(
    onboardingLogout.then((response) => response.status() === 204),
    'Onboarding logout did not complete with 204.',
  );
  await onboardingPage.getByRole('heading', { name: 'Sign in' }).waitFor();
  await onboardingPage.goto(`${baseUrl}${householdPath}`);
  await onboardingPage.getByRole('heading', { name: 'Sign in' }).waitFor();
  await check(
    onboardingPage
      .getByText(billName, { exact: true })
      .count()
      .then((count) => count === 0),
    'A revoked session exposed household bill content.',
  );
  await onboardingContext.close();

  console.log(
    `Live authentication browser checks passed: ${assertionCount} assertions against the real API, PostgreSQL, and Redis.`,
  );
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  await browser?.close();
  terminateServer();
}
process.exitCode = exitCode;
