import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const story = (name: string) =>
  `/iframe.html?id=shell-application-shell--${name}&viewMode=story`;

test('desktop sidebar marks the route and supports collapse', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story('expanded'));
  await expect(page.getByLabel('Application sidebar')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeHidden();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.locator('.shell')).toHaveAttribute(
    'data-sidebar',
    'collapsed',
  );
  await expect(
    page.getByRole('button', { name: 'Expand sidebar' }),
  ).toBeVisible();
});

test('the canonical breakpoint switches navigation at exactly 1024px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto(story('expanded'));
  await expect(page.getByLabel('Application sidebar')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(page.getByLabel('Application sidebar')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toBeHidden();
});

test('mobile drawer is keyboard-contained and restores focus on Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(story('mobile'));
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close navigation' }),
  ).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test('skip navigation reaches the main landmark', async ({ page }) => {
  await page.goto(story('expanded'));
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await skip.focus();
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('shell stories support themes, reduced motion, and accessible structure', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const theme of ['light', 'dark']) {
    await page.goto(`${story('long-navigation')}&globals=theme:${theme}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('.shell')).toHaveCSS(
      'transition-property',
      'none',
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        )
        .map((violation) => violation.id),
    ).toEqual([]);
  }
});
