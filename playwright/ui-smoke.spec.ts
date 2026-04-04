import { expect, test } from "@playwright/test";

test("landing page keeps premium hero and CTA visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /premium control plane/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore dashboard/i }).first()).toBeVisible();
  await expect(page.getByText(/build beautiful frontends/i)).toBeVisible();
});

test("dashboard shows workspace structure", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText(/workspace dashboard/i)).toBeVisible();
  await expect(page.getByText(/command workspace/i)).toBeVisible();
  await expect(page.getByText(/today's workspace focus/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /open console/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open operations/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open briefs/i })).toBeVisible();
});

test("mobile layout avoids horizontal overflow on key routes", async ({ page }) => {
  await page.goto("/");
  const homeWidths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(homeWidths.scroll).toBe(homeWidths.viewport);

  await page.goto("/dashboard");
  const dashboardWidths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dashboardWidths.scroll).toBe(dashboardWidths.viewport);
});
