import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "./helpers/auth";

test("auth page shows the account entry flow", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /log in/i }).first()).toBeVisible();
});

test("console page shows the live command workspace", async ({ page }) => {
  const databaseReady = await hasDatabaseAccess(page);
  if (databaseReady) {
    await loginAsShowcaseAdmin(page, "/console");
  } else {
    await page.goto("/console", { waitUntil: "domcontentloaded" });
  }
  if (!databaseReady) {
    await expect(page).toHaveURL(/\/auth\?next=%2Fconsole/);
    await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();
    return;
  }
  await expect(page.getByText(/operations console/i)).toBeVisible();
  await expect(page.getByText(/command desk/i)).toBeVisible();
  await expect(page.getByText(/live briefing/i)).toBeVisible();
});

test("briefs page keeps the premium research intake structure", async ({ page }) => {
  const databaseReady = await hasDatabaseAccess(page);
  if (databaseReady) {
    await loginAsShowcaseAdmin(page, "/briefs");
  }
  await page.goto("/briefs", { waitUntil: "networkidle" });
  if (!databaseReady) {
    await expect(page).toHaveURL(/\/auth\?next=%2Fbriefs/);
    await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();
    return;
  }
  await expect(page.getByText(/create a new brief/i)).toBeVisible();
  await expect(page.getByText(/tracked briefs/i)).toBeVisible();
  await expect(page.getByText(/research desk direction/i)).toBeVisible();
});

test("reports page keeps the editorial workflow structure", async ({ page }) => {
  const databaseReady = await hasDatabaseAccess(page);
  if (databaseReady) {
    await loginAsShowcaseAdmin(page, "/reports");
  }
  await page.goto("/reports", { waitUntil: "networkidle" });
  if (!databaseReady) {
    await expect(page).toHaveURL(/\/auth\?next=%2Freports/);
    await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();
    return;
  }
  await expect(page.getByText(/create a report/i)).toBeVisible();
  await expect(page.getByText(/tracked reports/i)).toBeVisible();
  await expect(page.getByText(/ready to publish/i)).toBeVisible();
});

test("auth and console pages avoid horizontal overflow", async ({ page }) => {
  const databaseReady = await hasDatabaseAccess(page);
  if (databaseReady) {
    await loginAsShowcaseAdmin(page, "/console");
  }
  for (const route of ["/auth", "/console"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    if (route === "/console" && databaseReady) {
      await page.getByText(/operations console/i).waitFor();
      await page.waitForTimeout(250);
    }
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBe(widths.viewport);
  }
});
