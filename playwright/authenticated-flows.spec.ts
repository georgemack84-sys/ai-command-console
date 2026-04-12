import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "./helpers/auth";

test.describe("authenticated showcase flows", () => {
  test.describe.configure({ timeout: 60_000 });

  test("showcase admin can log in and see the critical signals dashboard", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed auth is required for authenticated showcase flows.");

    await loginAsShowcaseAdmin(page, "/dashboard");

    await expect(page.getByText(/workspace dashboard/i)).toBeVisible();
    await expect(page.getByText(/critical signals to address now/i)).toBeVisible();
    await expect(page.getByText(/fastest next move/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /acknowledge/i }).first()).toBeVisible();
  });

  test("showcase admin can access operations and platform control surfaces", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed auth is required for authenticated showcase flows.");

    await loginAsShowcaseAdmin(page, "/operations");

    await expect(page.getByRole("heading", { name: /^workspace operations$/i }).last()).toBeVisible();
    await expect(page.getByText(/guided operations/i).first()).toBeVisible();

    await page.goto("/platform", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/^platform control center$/i)).toBeVisible();
    await expect
      .poll(async () => page.getByText(/platform teams board/i).last().isVisible(), { timeout: 30_000, intervals: [500, 1_000, 2_000] })
      .toBe(true);
  });

  test("showcase admin can access research briefs and reports", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed auth is required for authenticated showcase flows.");

    await loginAsShowcaseAdmin(page, "/briefs");

    await expect(page.getByText(/create a new brief/i)).toBeVisible();
    await expect(page.getByText(/tracked briefs/i)).toBeVisible();

    await page.goto("/reports");
    await expect(page.getByText(/create a report/i)).toBeVisible();
    await expect(page.getByText(/tracked reports/i)).toBeVisible();
  });
});
