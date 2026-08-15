import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const story = (name: string) =>
  `/iframe.html?id=authentication-states--${name}&viewMode=story`;

test('login is keyboard operable without overflow at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(story('login-default'));
  const username = page.getByLabel('Username *');
  const password = page.getByLabel('Password *');
  await username.focus();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await username.fill('synthetic-operator-with-a-deliberately-long-name');
  await password.fill(
    'synthetic-password-that-is-never-submitted-to-a-backend',
  );
  await password.press('Enter');
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test('authentication outcomes expose safe and distinct presentation', async ({
  page,
}) => {
  await page.goto(story('login-invalid-credentials'));
  await expect(page.getByRole('alert')).toHaveText(
    'Unable to sign in with those credentials.',
  );
  await page.goto(story('login-rate-limited'));
  await expect(page.getByRole('alert')).toContainText(
    'Too many sign-in attempts',
  );
  await page.goto(story('login-service-unavailable'));
  await expect(page.getByRole('alert')).toContainText('right now');
  await page.goto(story('login-submitting'));
  await expect(page.getByRole('button', { name: 'Signing in' })).toBeDisabled();
});

test('unknown session state contains no protected or credential UI', async ({
  page,
}) => {
  await page.goto(story('bootstrap-loading'));
  await expect(page.getByText('Resolving your session…')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toHaveCount(0);
  await expect(page.getByLabel('Application sidebar')).toHaveCount(0);
});

test('login and bootstrap stories retain theme and Axe contracts', async ({
  page,
}) => {
  for (const theme of ['light', 'dark']) {
    for (const name of ['login-invalid-credentials', 'bootstrap-loading']) {
      await page.goto(`${story(name)}&globals=theme:${theme}`);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations
          .filter((violation) =>
            ['serious', 'critical'].includes(violation.impact ?? ''),
          )
          .map((violation) => violation.id),
      ).toEqual([]);
    }
  }
});
