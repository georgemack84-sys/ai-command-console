import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "../../playwright/helpers/auth";

function operatorViewPayload(disputed = false, executionId = disputed ? "demo-dashboard-disputed" : "demo-dashboard-normal") {
  return {
    ok: true,
    data: {
      executionId,
      readModel: {
        executionId,
        execution: { status: disputed ? "failed" : "running" },
        recovery: { status: disputed ? "completed" : "none", attemptsCount: disputed ? 1 : 0 },
        recoveryControl: { status: disputed ? "approved" : "none", requiresApproval: false },
        advisory: {
          status: disputed ? "request_created" : "none",
          requiresOperator: false,
          advisoryOnly: true,
        },
        automation: { status: "none", automationAllowed: false },
        autonomy: { status: disputed ? "requires_operator" : "none", autonomyAllowed: false },
        verification: { status: disputed ? "failed" : "not_run" },
        learning: {
          status: "not_run",
          recommendationCount: 0,
          hasPolicyRecommendations: false,
          hasWarnings: disputed,
          advisoryOnly: true,
        },
        lock: { isLocked: disputed, stale: disputed },
        ledger: { totalEvents: disputed ? 2 : 1, lastEventType: disputed ? "execution.failed" : "execution.started" },
        risk: {
          hasFailure: disputed,
          hasVerificationFailure: disputed,
          hasStaleLock: disputed,
          hasOpenAdvisory: false,
          hasUnsafeUnknown: false,
          hasLearningWarnings: disputed,
          requiresOperatorAttention: disputed,
        },
        meta: { completeness: disputed ? "partial" : "complete", warnings: disputed ? ["MISSING_LEDGER"] : [] },
      },
      timeline: {
        executionId,
        events: [
          {
            eventId: "event_1",
            executionId,
            timestamp: 1700000000000,
            source: "execution",
            type: disputed ? "execution_failed" : "execution_started",
            severity: disputed ? "error" : "info",
            summary: disputed ? "execution failed" : "execution started",
          },
        ],
        meta: {
          totalEvents: 1,
          timeRange: { start: 1700000000000, end: 1700000000000 },
          completeness: disputed ? "partial" : "complete",
          warnings: disputed ? ["TIMELINE_STATE_MISMATCH"] : [],
          matchesReadModel: !disputed,
        },
      },
      timelineMatchesReadModel: !disputed,
      allowedActions: disputed
        ? [
            { action: "ADD_NOTE", allowed: true },
            { action: "REQUEST_VERIFICATION", allowed: false, reason: "Timeline does not currently explain read model" },
            { action: "DISMISS_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
            { action: "ESCALATE_ADVISORY", allowed: false, reason: "Timeline does not currently explain read model" },
            { action: "VIEW_EVIDENCE", allowed: true },
          ]
        : [
            { action: "ADD_NOTE", allowed: true },
            { action: "REQUEST_VERIFICATION", allowed: true },
            { action: "DISMISS_ADVISORY", allowed: false, reason: "Advisory is not open." },
            { action: "ESCALATE_ADVISORY", allowed: false, reason: "Advisory is not open." },
            { action: "VIEW_EVIDENCE", allowed: true },
          ],
      warnings: disputed ? ["Timeline does not explain current state"] : [],
    },
  };
}

function evidencePayload(disputed = false, executionId = disputed ? "demo-dashboard-disputed" : "demo-dashboard-normal") {
  const operatorView = operatorViewPayload(disputed, executionId).data;
  return {
    ok: true,
    data: {
      executionId,
      readModel: operatorView.readModel,
      timeline: operatorView.timeline,
      state: disputed ? "disputed" : "normal",
      sections: {
        execution: {},
        recovery: {},
        control: {},
        advisory: {},
        automation: {},
        autonomy: {},
        verification: {},
        learning: {},
        lock: {},
        ledger: {},
      },
      integrity: {
        hash: disputed ? "demo_disputed_hash" : "demo_normal_hash",
        algorithm: "sha256",
        matchesReadModel: !disputed,
      },
      meta: {
        completeness: disputed ? "partial" : "complete",
        warnings: disputed ? ["Timeline does not explain current state", "Operator actions may be restricted"] : [],
        version: "3.5D-2",
      },
    },
  };
}

async function wireScenario(page: any, executionId: string, disputed: boolean) {
  await page.route(`**/api/recovery/${executionId}/operator-view`, async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(operatorViewPayload(disputed, executionId)),
    });
  });

  await page.route(`**/api/recovery/${executionId}/evidence*`, async (route: any) => {
    const url = new URL(route.request().url());
    const format = url.searchParams.get("format");
    const body =
      format === "markdown"
        ? { ok: true, data: "# Recovery Evidence Report\n\n## Integrity" }
        : format === "json"
          ? { ok: true, data: evidencePayload(disputed, executionId).data }
          : evidencePayload(disputed, executionId);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test.describe("recovery demo dashboard", () => {
  test.setTimeout(60_000);

  test("dashboard loads demo normal scenario and renders timeline", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed auth is required for dashboard flows.");

    await loginAsShowcaseAdmin(page, "/dashboard");
    await wireScenario(page, "demo-dashboard-normal", false);
    await page.goto("/recovery?executionId=demo-dashboard-normal", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/NORMAL/i).first()).toBeVisible();
    await expect(page.getByText(/demo_normal_hash/i)).toBeVisible();
    await expect(page.getByText(/execution started/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /add note/i })).toBeEnabled();
  });

  test("dashboard loads demo disputed scenario and freezes mutating actions", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed auth is required for dashboard flows.");

    await loginAsShowcaseAdmin(page, "/dashboard");
    await wireScenario(page, "demo-dashboard-disputed", true);
    await page.goto("/recovery?executionId=demo-dashboard-disputed", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/DISPUTED/i).first()).toBeVisible();
    await expect(page.getByText(/evidence indicates system inconsistency/i)).toBeVisible();
    await expect(page.getByText(/demo_disputed_hash/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /export json/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export markdown/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add note/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /request verification/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /dismiss advisory/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /escalate advisory/i })).toBeDisabled();
    await expect(page.getByText(/execution failed/i).first()).toBeVisible();
  });
});
