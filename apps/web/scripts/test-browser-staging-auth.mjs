import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const baseUrl = (
  process.env.PROPRIUM_STAGING_BASE_URL ?? 'https://34.172.207.119.sslip.io'
).replace(/\/$/, '');
const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const username = `staging-check-${suffix}`;
const displayName = `Staging Check ${suffix}`;
const password = 'long-enough-password';

let browser;
try {
  console.log('1/5 Opening staging registration.');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/register`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await page
    .getByRole('heading', { name: 'Create account' })
    .waitFor({ timeout: 15_000 });
  await page
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill(displayName);
  await page
    .getByRole('textbox', { name: 'Username', exact: true })
    .fill(username);
  await page.locator('input[type="password"]').fill(password);
  const registration = page.waitForResponse(
    (response) =>
      response.url() === `${baseUrl}/api/v1/auth/register` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Create account' }).click();
  assert.equal((await registration).status(), 204, 'Registration failed.');

  console.log('2/5 Verifying authenticated dashboard and session cookie.');
  await page.goto(`${baseUrl}/dashboard`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await page
    .getByRole('heading', { name: 'Dashboard' })
    .waitFor({ timeout: 15_000 });
  const session = (await context.cookies(baseUrl)).find(
    (cookie) => cookie.name === 'proprium_session',
  );
  if (!session) throw new Error('No session cookie was issued.');
  assert.equal(
    session?.httpOnly,
    true,
    'No HttpOnly session cookie was issued.',
  );

  console.log('3/5 Verifying session restoration after refresh.');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page
    .getByRole('heading', { name: 'Dashboard' })
    .waitFor({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Open user menu' }).click();
  const logout = page.waitForResponse(
    (response) =>
      response.url() === `${baseUrl}/api/v1/auth/logout` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  assert.equal((await logout).status(), 204, 'Logout failed.');
  await page
    .getByRole('heading', { name: 'Sign in' })
    .waitFor({ timeout: 15_000 });

  console.log('4/5 Replaying the revoked session on the protected route.');
  const replay = await browser.newContext();
  await replay.addCookies([session]);
  const replayPage = await replay.newPage();
  await replayPage.goto(`${baseUrl}/dashboard`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await replayPage
    .getByRole('heading', { name: 'Sign in' })
    .waitFor({ timeout: 15_000 });
  assert.equal(
    await replayPage.getByRole('heading', { name: 'Dashboard' }).count(),
    0,
    'A revoked session exposed protected content.',
  );
  await replay.close();
  await context.close();
  console.log(`5/5 Staging auth acceptance passed for ${username}.`);
} finally {
  await browser?.close();
}
