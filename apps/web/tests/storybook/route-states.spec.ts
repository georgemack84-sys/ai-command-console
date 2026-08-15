import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const story = (name: string) =>
  `/iframe.html?id=patterns-route-states--${name}&viewMode=story`;

test('loading is polite, decorative, and motion-safe', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(story('loading'));
  await expect(page.getByRole('status')).toHaveText('Loading page…');
  await expect(page.locator('.ui-skeleton').first()).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.locator('.ui-skeleton').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(page.locator('body')).toBeFocused();
});

test('error recovery is keyboard operable and focus establishes route context', async ({
  page,
}) => {
  await page.goto(story('recoverable-error'));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Something went wrong' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Return home' })).toBeFocused();
});

test('route states remain readable without overflow at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const name of [
    'long-loading',
    'error-with-long-copy',
    'not-found-with-long-copy',
  ]) {
    await page.goto(story(name));
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
});

test('route states honor light, dark, and system theme selection', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const { preference, resolved } of [
    { preference: 'light', resolved: 'light' },
    { preference: 'dark', resolved: 'dark' },
    { preference: 'system', resolved: 'dark' },
  ]) {
    await page.goto(`${story('not-found')}&globals=theme:${preference}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', resolved);
  }
});

test('route-state stories have no serious or critical Axe violations', async ({
  page,
}) => {
  for (const name of ['loading', 'recoverable-error', 'not-found']) {
    await page.goto(story(name));
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        )
        .map((violation) => `${name}:${violation.id}`),
    ).toEqual([]);
  }
});
