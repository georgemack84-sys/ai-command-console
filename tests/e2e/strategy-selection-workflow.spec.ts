import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "../../playwright/helpers/auth";

test.describe("Phase 40 strategy-selection manager workflow", () => {
  test("records each manager transition while keeping learning execution unavailable", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed manager authentication is required for this workflow.");

    await page.route("**/api/learning/strategy-selection", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: { profile: { profileId: "OBJ-E2E", objectiveId: "LO-E2E", domain: "Security" } } }) });
    });
    await page.route("**/api/learning/strategy-selection/select", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: { selection: { selectionId: "SEL-E2E", selectedStrategyId: "TARGETED-REVIEW", status: "RECOMMENDED", executionPermissionGranted: false } } }) });
    });
    await page.route("**/api/learning/strategy-selection/propose-plan", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: { proposal: { proposalId: "SCP-E2E" } } }) });
    });
    await page.route("**/api/learning/strategy-selection/approve-plan", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: { bridge: { bridgeId: "BRIDGE-E2E" }, lease: { leaseId: "LEASE-E2E", status: "ACTIVE" } } }) });
    });

    await loginAsShowcaseAdmin(page, "/learning/strategy-selection");
    await expect(page.getByRole("heading", { name: "Strategy Selection" })).toBeVisible();
    await expect(page.getByText(/selection does not approve plans, grant leases, or execute learning/i)).toBeVisible();

    const profile = page.locator("article", { has: page.getByRole("heading", { name: "Profile the learning objective" }) });
    await profile.locator('input[name="objectiveId"]').fill("LO-E2E");
    await profile.locator('input[name="domain"]').fill("Security");
    await profile.getByRole("button", { name: "Create immutable profile" }).click();
    await expect(page.getByText(/recorded\. the page lists the next governed step/i)).toBeVisible();

    const selection = page.locator("article", { has: page.getByRole("heading", { name: "Request advisory selection" }) });
    await expect(selection.locator('option[value="OBJ-E2E"]')).toBeAttached();
    await selection.locator('select[name="profileId"]').selectOption("OBJ-E2E");
    await selection.getByRole("button", { name: "Record advisory selection" }).click();
    await expect(selection.getByText(/cannot approve a plan or grant execution permission/i)).toBeVisible();

    const proposal = page.locator("article", { has: page.getByRole("heading", { name: "Propose curriculum handoff" }) });
    await expect(proposal.locator('option[value="SEL-E2E"]')).toBeAttached();
    await proposal.locator('select[name="selectionId"]').selectOption("SEL-E2E");
    await proposal.locator('input[name="goal"]').fill("Diagnose authentication failures");
    await proposal.getByRole("button", { name: "Propose plan" }).click();

    const approval = page.locator("article", { has: page.getByRole("heading", { name: "Explicit human approval" }) });
    await expect(approval.locator('input[name="proposalId"]')).toHaveValue("SCP-E2E");
    await approval.locator('input[name="approval"]').check();
    await approval.getByRole("button", { name: "Approve and create bounded lease" }).click();
    await expect(page.locator('input[name="bridgeId"]')).toHaveValue("BRIDGE-E2E");

    await expect(page.getByRole("button", { name: /execute|run learning|start learning/i })).toHaveCount(0);
    await expect(page.getByText(/this creates a proposed curriculum only; it does not run learning/i)).toBeVisible();
  });
});
