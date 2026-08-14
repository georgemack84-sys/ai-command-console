import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const shellStory = (name: string) =>
  `/iframe.html?id=shell-application-shell--${name}&viewMode=story`;
const componentStory = (name: string) =>
  `/iframe.html?id=components-core-primitives--${name}&viewMode=story`;
const overlayStory = (name: string) =>
  `/iframe.html?id=components-overlays--${name}&viewMode=story`;
const routeStory = (name: string) =>
  `/iframe.html?id=patterns-route-states--${name}&viewMode=story`;

const hasNoHorizontalOverflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );

test('320px shell remains reachable and cleans an open drawer at 1024px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(shellStory('long-navigation'));
  await expect(hasNoHorizontalOverflow(page)).resolves.toBe(true);
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 640 });
  await expect(page.getByRole('dialog', { name: 'Navigation' })).toHaveCount(0);
  await expect(page.getByLabel('Application sidebar')).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(trigger).toBeVisible();
  await expect(hasNoHorizontalOverflow(page)).resolves.toBe(true);
});

test('200% text scale preserves form reachability and visible keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto(componentStory('forms'));
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await expect(hasNoHorizontalOverflow(page)).resolves.toBe(true);
  const projectName = page.getByLabel('Project name');
  await expect(projectName).toHaveAttribute('required', '');
  await projectName.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Description')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(projectName).toBeFocused();
  const focusVisible = await projectName.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
  });
  expect(focusVisible, 'focus-visible styling must remain perceivable').toBe(
    true,
  );
  await projectName.fill('Qualified project');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Description')).toBeFocused();
  await expect(page.getByLabel('Description')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});

test('overlay dismissal removes portals and restores global page state', async ({
  page,
}) => {
  await page.goto(overlayStory('dialog-basic'));
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.locator('[data-radix-portal]')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      [...document.body.children].some(
        (element) =>
          element.hasAttribute('inert') ||
          element.getAttribute('aria-hidden') === 'true',
      ),
    ),
  ).toBe(false);
});

test('representative light and dark route recovery is Axe-clean and console-clean', async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().startsWith('Failed to load resource:')
    )
      browserErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    if (url.hostname === '127.0.0.1') {
      browserErrors.push(
        `Local request failed: ${url.pathname} (${request.failure()?.errorText ?? 'unknown'})`,
      );
    }
  });
  for (const theme of ['light', 'dark']) {
    await page.goto(
      `${routeStory('recoverable-error')}&globals=theme:${theme}`,
    );
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.getByRole('button', { name: 'Try again' }).focus();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        )
        .map((violation) => violation.id),
    ).toEqual([]);
  }
  expect(browserErrors).toEqual([]);
});
