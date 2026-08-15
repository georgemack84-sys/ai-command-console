import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const story = (name: string) =>
  `/iframe.html?id=components-core-primitives--${name}&viewMode=story`;

test('core actions expose native disabled, busy, and focus contracts', async ({
  page,
}) => {
  await page.goto(story('actions'));
  await expect(
    page.getByRole('button', { name: 'Disabled action' }),
  ).toBeDisabled();
  const loading = page.getByRole('button', { name: 'Saving changes' });
  await expect(loading).toHaveAttribute('aria-busy', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus-visible')).toHaveCount(1);
});

test('field relationships and invalid semantics survive narrow layouts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(story('forms'));
  const description = page.getByLabel('Description');
  await expect(description).toHaveAttribute('aria-invalid', 'true');
  await expect(description).toHaveAttribute('aria-describedby', /description/);
  await expect(description).toHaveAttribute('aria-describedby', /error/);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test('core components consume the shared light and dark theme boundary', async ({
  page,
}) => {
  await page.goto(`${story('cards')}&globals=theme:dark`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto(`${story('cards')}&globals=theme:light`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('core component stories have no serious or critical Axe violations', async ({
  page,
}) => {
  for (const name of ['actions', 'forms', 'cards', 'loading', 'states']) {
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

test('spinner and skeleton animation is disabled for reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(story('loading'));
  await expect(page.locator('.ui-spinner').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(page.locator('.ui-skeleton').first()).toHaveCSS(
    'animation-name',
    'none',
  );
});
