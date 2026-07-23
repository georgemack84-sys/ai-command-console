import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the overlay Storybook example opens and closes a dialog', async ({
  page,
}) => {
  await page.goto(
    '/iframe.html?id=components-overlays--default&viewMode=story',
  );
  await page.getByRole('button', { name: 'Open dialog' }).click();
  const dialog = page.getByRole('dialog', { name: 'Project settings' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

test('the overlay Storybook example exposes a disabled menu item', async ({
  page,
}) => {
  await page.goto(
    '/iframe.html?id=components-overlays--default&viewMode=story',
  );
  await page.getByRole('button', { name: 'Actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
    'data-disabled',
    '',
  );
});

test('the overlay Storybook example has no serious or critical Axe violations', async ({
  page,
}) => {
  await page.goto(
    '/iframe.html?id=components-overlays--default&viewMode=story',
  );
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations
      .filter((violation) =>
        ['serious', 'critical'].includes(violation.impact ?? ''),
      )
      .map((violation) => violation.id),
  ).toEqual([]);
});
