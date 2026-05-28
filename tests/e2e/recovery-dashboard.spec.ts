import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "../../playwright/helpers/auth";

function operatorViewPayload(disputed = false) {
  return {
    ok: true,
    data: {
      executionId: "exec_ui",
      readModel: {
        executionId: "exec_ui",
        execution: { status: "failed" },
        recovery: { status: "failed", attemptsCount: 1 },
        recoveryControl: { status: "approval_required", requiresApproval: true, latestRequestId: "req_1" },
        advisory: { status: "open", latestAdvisoryId: "adv_1", recommendation: "operator_recovery", requiresOperator: true, advisoryOnly: true },
        automation: { status: "blocked", automationAllowed: false },
        autonomy: { status: disputed ? "requires_operator" : "blocked", autonomyAllowed: false },
        verification: { status: disputed ? "failed" : "not_run" },
        learning: {
          status: "report_available",
          recommendationCount: 1,
          hasPolicyRecommendations: true,
          hasWarnings: disputed,
          advisoryOnly: true,
        },
        lock: { isLocked: true, stale: disputed },
        ledger: { totalEvents: 4, lastEventType: "execution.failed" },
        risk: {
          hasFailure: true,
          hasVerificationFailure: disputed,
          hasStaleLock: disputed,
          hasOpenAdvisory: true,
          hasUnsafeUnknown: false,
          hasLearningWarnings: disputed,
          requiresOperatorAttention: true,
        },
        meta: { completeness: disputed ? "partial" : "complete", warnings: [] },
      },
      timeline: {
        executionId: "exec_ui",
        events: [
          {
            eventId: "event_1",
            executionId: "exec_ui",
            timestamp: 1700000000000,
            source: "execution",
            type: "execution_failed",
            severity: "error",
            summary: "execution failed",
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
            { action: "DISMISS_ADVISORY", allowed: true },
            { action: "ESCALATE_ADVISORY", allowed: true },
            { action: "VIEW_EVIDENCE", allowed: true },
          ],
      warnings: disputed ? ["Timeline does not explain current state"] : [],
    },
  };
}

function evidencePayload(disputed = false) {
  return {
    ok: true,
    data: {
      executionId: "exec_ui",
      readModel: operatorViewPayload(disputed).data.readModel,
      timeline: operatorViewPayload(disputed).data.timeline,
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
        hash: disputed ? "disputed_hash" : "normal_hash",
        algorithm: "sha256",
        matchesReadModel: !disputed,
      },
      meta: {
        completeness: disputed ? "partial" : "complete",
        warnings: disputed ? ["Timeline does not explain current state"] : [],
        version: "3.5D-2",
      },
    },
  };
}

test.describe("recovery dashboard", () => {
  test("dashboard loads operator view + evidence, shows disputed warnings, exports, blocks actions, and renders timeline", async ({ page }) => {
    const databaseReady = await hasDatabaseAccess(page);
    test.skip(!databaseReady, "Database-backed auth is required for recovery dashboard flows.");

    await loginAsShowcaseAdmin(page, "/dashboard");

    await page.route("**/api/recovery/exec_ui/operator-view", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(operatorViewPayload(true)),
      });
    });

    await page.route("**/api/recovery/exec_ui/evidence*", async (route) => {
      const url = new URL(route.request().url());
      const format = url.searchParams.get("format");
      const body =
        format === "markdown"
          ? { ok: true, data: "# Recovery Evidence Report\n\n## ⚠️ Consistency Warning" }
          : format === "json"
            ? { ok: true, data: evidencePayload(true).data }
            : evidencePayload(true);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await page.goto("/recovery?executionId=exec_ui", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/evidence-aware recovery dashboard/i)).toBeVisible();
    await expect(page.getByText(/DISPUTED/i).first()).toBeVisible();
    await expect(page.getByText(/evidence indicates system inconsistency/i)).toBeVisible();
    await expect(page.getByText(/disputed_hash/i)).toBeVisible();
    await expect(page.getByText(/execution failed/i).first()).toBeVisible();

    await expect(page.getByRole("button", { name: /request verification/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /dismiss advisory/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /escalate advisory/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /add note/i })).toBeEnabled();

    const [response] = await Promise.all([
      page.waitForResponse((entry) => entry.url().includes("/api/recovery/exec_ui/evidence?format=markdown")),
      page.getByRole("button", { name: /export markdown/i }).click(),
    ]);
    expect(response.ok()).toBeTruthy();
  });
});

