import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "./helpers/auth";

test("landing page keeps premium hero and CTA visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /premium control plane/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /explore dashboard/i }).first()).toBeVisible();
  await expect(page.getByText(/build beautiful frontends/i)).toBeVisible();
});

test("dashboard shows workspace structure", async ({ page }) => {
  const databaseReady = await hasDatabaseAccess(page);
  if (databaseReady) {
    await loginAsShowcaseAdmin(page, "/dashboard");
  }
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  if (!databaseReady) {
    await expect(page).toHaveURL(/\/auth\?next=%2Fdashboard/);
    await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();
    return;
  }
  await expect(page.getByText(/workspace dashboard/i)).toBeVisible();
  await expect(page.getByText(/today's workspace focus/i)).toBeVisible();
  await expect(page.getByText(/recent activity/i)).toBeVisible();
  await expect(page.getByText(/today's workspace focus/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /open console/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open operations/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /open briefs/i }).first()).toBeVisible();
});

test("mobile layout avoids horizontal overflow on key routes", async ({ page }) => {
  await page.goto("/");
  const homeWidths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(homeWidths.scroll).toBe(homeWidths.viewport);

  const databaseReady = await hasDatabaseAccess(page);
  if (databaseReady) {
    await loginAsShowcaseAdmin(page, "/dashboard");
  }
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  if (!databaseReady) {
    await expect(page).toHaveURL(/\/auth\?next=%2Fdashboard/);
  }
  const dashboardWidths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dashboardWidths.scroll).toBe(dashboardWidths.viewport);
});
