import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const story = (name: string) =>
  `/iframe.html?id=components-overlays--${name}&viewMode=story`;

test('Dialog traps focus, closes on Escape, and restores its trigger', async ({
  page,
}) => {
  await page.goto(story('dialog-basic'));
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Project settings' });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Project name')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Project name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.locator('.ui-dialog-backdrop').click({
    position: { x: 2, y: 2 },
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('AlertDialog starts safely and ignores outside pointer dismissal', async ({
  page,
}) => {
  await page.goto(story('alert-dialog-destructive'));
  const trigger = page.getByRole('button', { name: 'Delete project' });
  await trigger.click();
  const alert = page.getByRole('alertdialog', { name: 'Delete this project?' });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.locator('.ui-dialog-backdrop').click({ position: { x: 2, y: 2 } });
  await expect(alert).toBeVisible();
  await alert.getByRole('button', { name: 'Cancel' }).click();
  await expect(alert).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('DropdownMenu supports arrows, disabled items, activation, and focus return', async ({
  page,
}) => {
  await page.goto(story('dropdown-actions'));
  const trigger = page.getByRole('button', { name: 'Project actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Rename project' }),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('menuitem', { name: /Duplicate project/ }),
  ).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('menuitem', { name: 'Delete project' }),
  ).toBeFocused();
  await page.keyboard.press('Home');
  await expect(
    page.getByRole('menuitem', { name: 'Rename project' }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Rename project' }).click();
  await expect(page.getByRole('status')).toHaveText('Rename selected');
  await trigger.click();
  await page.mouse.click(1, 1);
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('a menu can transfer interaction to a topmost AlertDialog', async ({
  page,
}) => {
  await page.goto(story('nested-confirmation'));
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete project' }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
  const alert = page.getByRole('alertdialog', {
    name: 'Delete nested example?',
  });
  await expect(alert).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(alert).toHaveCount(0);
});

test('long modal content is bounded and usable at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(story('dialog-long-content'));
  const dialog = page.getByRole('dialog', { name: 'Long dialog content' });
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(
    dialog.getByRole('button', { name: 'Close review' }),
  ).toBeVisible();
});

test('overlays preserve theme, reduced motion, shell layering, and Axe contracts', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const { preference, resolved } of [
    { preference: 'light', resolved: 'light' },
    { preference: 'dark', resolved: 'dark' },
    { preference: 'system', resolved: 'dark' },
  ]) {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.goto(`${story('overlay-in-shell')}&globals=theme:${preference}`);
    await page.getByRole('button', { name: 'Open dialog' }).click();
    const dialog = page.getByRole('dialog', { name: 'Project settings' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', resolved);
    await expect(dialog).toHaveCSS('animation-name', 'none');
    const layers = await page.evaluate(() => {
      const dialogElement = document.querySelector('[role="dialog"]');
      const headerElement = document.querySelector('.shell-header');
      if (!dialogElement || !headerElement)
        throw new Error('Expected shell and dialog layers.');
      return {
        dialog: Number.parseInt(getComputedStyle(dialogElement).zIndex),
        header: Number.parseInt(getComputedStyle(headerElement).zIndex),
      };
    });
    expect(layers.dialog).toBeGreaterThan(layers.header);
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
