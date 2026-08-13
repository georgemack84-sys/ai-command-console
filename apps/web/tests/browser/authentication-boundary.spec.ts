import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('a no-cookie protected request redirects before protected content is rendered', async ({
  page,
}) => {
  await page.goto('/dashboard?tab=recent');
  await expect(page).toHaveURL(
    /\/login\?returnTo=%2Fdashboard%3Ftab%3Drecent$/,
  );
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByText('Dashboard')).toBeHidden();
});

for (const width of [320, 375, 768, 1280]) {
  test(`login has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}

test('the password visibility control preserves the entered password', async ({
  page,
}) => {
  await page.goto('/login');
  const password = page.getByLabel('Password *');
  await password.fill('not-a-real-password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('not-a-real-password');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('login has no serious or critical Axe violations', async ({ page }) => {
  await page.goto('/login');
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations
      .filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      )
      .map((violation) => violation.id),
  ).toEqual([]);
});
