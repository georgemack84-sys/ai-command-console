import assert from 'node:assert/strict';

import { chromium } from 'playwright';

const baseUrl = (
  process.env.PROPRIUM_STAGING_BASE_URL ?? 'https://34.172.207.119.sslip.io'
).replace(/\/$/, '');
const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const username = `staging-check-${suffix}`;
const displayName = `Staging Check ${suffix}`;
const updatedDisplayName = `Updated Check ${suffix}`;
const password = 'long-enough-password';
const householdName = `Home ${suffix}`;
const billName = `Internet ${suffix}`;
const updatedAmount = '91.20';
const updatedDueDate = '2030-01-20';
const updatedNotes = 'Updated staging plan';

let browser;
try {
  console.log('1/7 Opening staging registration.');
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

  console.log(
    '2/7 Completing the household and routine bill-management journey.',
  );
  await page
    .getByRole('heading', { name: `${displayName}'s household` })
    .waitFor({ timeout: 15_000 });
  const householdPath = new URL(page.url()).pathname;
  assert.match(
    householdPath,
    /^\/households\/[0-9a-f-]+$/i,
    'Registration did not reach an explicit household route.',
  );
  await page.getByLabel('Household name *').fill(householdName);
  const rename = page.waitForResponse(
    (response) =>
      response.url() === `${baseUrl}/api/v1${householdPath}` &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Save name' }).click();
  assert.equal((await rename).status(), 200, 'Household rename failed.');
  await page.getByRole('heading', { name: householdName }).waitFor();
  await page.getByLabel('Bill name *').fill(billName);
  await page.getByLabel('Amount *').fill('87.45');
  await page.getByLabel('Due date *').fill('2030-01-15');
  const createBill = page.waitForResponse(
    (response) =>
      response.url() === `${baseUrl}/api/v1${householdPath}/bills` &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Add bill' }).click();
  assert.equal((await createBill).status(), 201, 'First-bill creation failed.');
  await page.getByText(billName, { exact: true }).waitFor();
  await page.getByRole('button', { name: `Edit ${billName}` }).click();
  await page.getByLabel(`Amount for ${billName} *`).fill(updatedAmount);
  await page.getByLabel(`Due date for ${billName} *`).fill(updatedDueDate);
  await page.getByLabel(`Notes for ${billName}`).fill(updatedNotes);
  const updateBill = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${baseUrl}/api/v1${householdPath}/bills/`) &&
      !response.url().endsWith('/payment-status') &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Save bill' }).click();
  assert.equal((await updateBill).status(), 200, 'Bill update failed.');
  await page
    .getByText(`$91.20 · Due ${updatedDueDate}`)
    .waitFor({ timeout: 15_000 });
  const markPaid = page.waitForResponse(
    (response) =>
      response.url().startsWith(`${baseUrl}/api/v1${householdPath}/bills/`) &&
      response.url().endsWith('/payment-status') &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Mark paid' }).click();
  assert.equal((await markPaid).status(), 200, 'Bill payment update failed.');
  await page
    .getByText(`$91.20 · Paid · due ${updatedDueDate}`)
    .waitFor({ timeout: 15_000 });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page
    .getByText(`$91.20 · Paid · due ${updatedDueDate}`)
    .waitFor({ timeout: 15_000 });
  await page.getByText(updatedNotes, { exact: true }).waitFor();

  console.log('3/7 Updating the account profile.');
  await page.goto(`${baseUrl}/profile`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await page
    .getByRole('heading', { name: 'Profile' })
    .waitFor({ timeout: 15_000 });
  await page.getByLabel('Display name *').fill(updatedDisplayName);
  const updateProfile = page.waitForResponse(
    (response) =>
      response.url() === `${baseUrl}/api/v1/auth/me` &&
      response.request().method() === 'PATCH',
  );
  await page.getByRole('button', { name: 'Save profile' }).click();
  assert.equal((await updateProfile).status(), 200, 'Profile update failed.');
  await page.getByRole('status').getByText('Profile saved.').waitFor();
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.getByDisplayValue(updatedDisplayName).waitFor({ timeout: 15_000 });

  console.log('4/7 Verifying authenticated dashboard and session cookie.');
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

  console.log('5/7 Verifying session restoration after refresh.');
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

  console.log('6/7 Replaying the revoked session on the protected routes.');
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
  await replayPage.goto(`${baseUrl}${householdPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await replayPage
    .getByRole('heading', { name: 'Sign in' })
    .waitFor({ timeout: 15_000 });
  assert.equal(
    await replayPage.getByText(billName, { exact: true }).count(),
    0,
    'A revoked session exposed household bill content.',
  );
  await replayPage.goto(`${baseUrl}/profile`, {
    waitUntil: 'domcontentloaded',
    timeout: 15_000,
  });
  await replayPage
    .getByRole('heading', { name: 'Sign in' })
    .waitFor({ timeout: 15_000 });
  assert.equal(
    await replayPage.getByRole('heading', { name: 'Profile' }).count(),
    0,
    'A revoked session exposed profile content.',
  );
  await replay.close();
  await context.close();
  console.log(`7/7 Staging onboarding acceptance passed for ${username}.`);
} finally {
  await browser?.close();
}
