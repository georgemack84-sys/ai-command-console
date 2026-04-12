import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  markInboxItemRead,
  acknowledgeInboxItem,
  updateDigestPreferenceSet,
  generateDigestForActor,
  queueDigestSweep,
  updateCollaborationGovernance,
  runApprovalPolicyAction,
  acknowledgeTrustAlert,
  restartRecommendationObservation,
  extendRecommendationCooldown,
} = require("../../services/legacyConsoleCollaborationSupport.js");

describe("legacy console collaboration support", () => {
  const actor = { id: "user_1", name: "Alex" };
  const workspace = "alpha";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T14:20:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks inbox items as read and records inbox history", () => {
    const updateInboxItemState = vi.fn();
    const recordInboxHistoryItem = vi.fn();

    const item = markInboxItemRead(actor, workspace, "item_1", {
      getDigestSchedulerStatus: vi.fn(() => ({ runs: [] })),
      buildDigestWorkspaceHealth: vi.fn(() => ({ workspaces: [] })),
      buildDigestEscalationSignals: vi.fn(() => []),
      loadCollaborationState: vi.fn(() => ({ governance: {} })),
      buildApprovalTrustSignals: vi.fn(() => []),
      buildApprovalTrustDashboard: vi.fn(() => ({ score: 0.92 })),
      getEnvironmentPolicy: vi.fn(() => ({ currentEnvironment: "production" })),
      buildApprovalTrustTrends: vi.fn(() => ({ trend: "stable" })),
      buildApprovalTrustEnvironmentSummaries: vi.fn(() => []),
      buildInbox: vi.fn(() => [{ id: "item_1", title: "Review digest" }]),
      buildOwnershipSignals: vi.fn(() => [{ workspaceId: workspace }]),
      updateInboxItemState,
      recordInboxHistoryItem,
    });

    expect(item).toEqual({ id: "item_1", title: "Review digest" });
    expect(updateInboxItemState).toHaveBeenCalledWith("user_1", "item_1", {
      readAt: "2026-04-10T14:20:00.000Z",
    });
    expect(recordInboxHistoryItem).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        id: "item_1",
        read: true,
        updatedAt: "2026-04-10T14:20:00.000Z",
      }),
    );
  });

  it("acknowledges inbox items and records the full state change", () => {
    const updateInboxItemState = vi.fn();
    const recordInboxHistoryItem = vi.fn();

    const item = acknowledgeInboxItem(actor, workspace, "item_2", {
      getDigestSchedulerStatus: vi.fn(() => ({ runs: [] })),
      buildDigestWorkspaceHealth: vi.fn(() => ({ workspaces: [] })),
      buildDigestEscalationSignals: vi.fn(() => []),
      loadCollaborationState: vi.fn(() => ({ governance: {} })),
      buildApprovalTrustSignals: vi.fn(() => []),
      buildApprovalTrustDashboard: vi.fn(() => ({ score: 0.87 })),
      getEnvironmentPolicy: vi.fn(() => ({ currentEnvironment: "production" })),
      buildApprovalTrustTrends: vi.fn(() => ({ trend: "improving" })),
      buildApprovalTrustEnvironmentSummaries: vi.fn(() => []),
      buildInbox: vi.fn(() => [{ id: "item_2", title: "Acknowledge alert" }]),
      buildOwnershipSignals: vi.fn(() => [{ workspaceId: workspace }]),
      updateInboxItemState,
      recordInboxHistoryItem,
    });

    expect(item).toEqual({ id: "item_2", title: "Acknowledge alert" });
    expect(updateInboxItemState).toHaveBeenCalledWith("user_1", "item_2", {
      readAt: "2026-04-10T14:20:00.000Z",
      acknowledgedAt: "2026-04-10T14:20:00.000Z",
    });
    expect(recordInboxHistoryItem).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        id: "item_2",
        read: true,
        acknowledged: true,
        updatedAt: "2026-04-10T14:20:00.000Z",
      }),
    );
  });

  it("normalizes digest preference payloads", () => {
    const updateDigestPreferences = vi.fn(() => ({ id: "pref_1", cadence: "weekly" }));

    const preferences = updateDigestPreferenceSet(
      actor,
      {
        enabled: 1,
        cadence: "weekly",
        preferredChannel: "email",
        includeTrustReport: "yes",
        trustAudience: "team",
        trustEnvironment: "production",
        immediateOnTrustDrop: "true",
      },
      { updateDigestPreferences },
    );

    expect(preferences).toEqual({ id: "pref_1", cadence: "weekly" });
    expect(updateDigestPreferences).toHaveBeenCalledWith("user_1", {
      enabled: true,
      cadence: "weekly",
      preferredChannel: "email",
      includeTrustReport: true,
      trustAudience: "team",
      trustEnvironment: "production",
      immediateOnTrustDrop: true,
    });
  });

  it("builds and records digests for an actor", () => {
    const buildDigestRun = vi.fn(() => ({ id: "digest_1", items: 3 }));
    const recordDigestRun = vi.fn(() => ({ id: "digest_1", status: "recorded" }));

    const digest = generateDigestForActor(actor, workspace, {
      recordDigestRun,
      buildDigestRun,
      loadCollaborationState: vi.fn(() => ({ governance: {} })),
      buildOwnershipSignals: vi.fn(() => [{ workspaceId: workspace }]),
      getDigestPreferences: vi.fn(() => ({ cadence: "daily" })),
    });

    expect(buildDigestRun).toHaveBeenCalledWith(
      actor,
      { governance: {} },
      [{ workspaceId: workspace }],
      { cadence: "daily" },
    );
    expect(recordDigestRun).toHaveBeenCalledWith("user_1", { id: "digest_1", items: 3 });
    expect(digest).toEqual({ id: "digest_1", status: "recorded" });
  });

  it("queues due digest sweeps", () => {
    const enqueueJob = vi.fn(() => ({ id: "job_1" }));

    const job = queueDigestSweep(workspace, actor, { enqueueJob });

    expect(enqueueJob).toHaveBeenCalledWith("digest:run-due", { workspace: "alpha" }, actor);
    expect(job).toEqual({ id: "job_1" });
  });

  it("updates collaboration governance through the extracted helper", () => {
    const updateGovernance = vi.fn(() => ({ currentEnvironment: "staging" }));

    const governance = updateCollaborationGovernance(
      {
        sensitiveActionsRequireApproval: true,
        currentEnvironment: "staging",
        environmentPolicies: { staging: { requireApproval: true } },
      },
      { updateGovernance },
    );

    expect(updateGovernance).toHaveBeenCalledWith({
      sensitiveActionsRequireApproval: true,
      currentEnvironment: "staging",
      environmentPolicies: { staging: { requireApproval: true } },
    });
    expect(governance).toEqual({ currentEnvironment: "staging" });
  });

  it("routes approval policy actions through the extracted helper", () => {
    const applyApprovalPolicyRecommendationChange = vi.fn(() => ({ ok: true, output: "applied" }));
    const rollbackApprovalPolicyPromotion = vi.fn(() => ({ ok: true, output: "rolled back" }));

    const applied = runApprovalPolicyAction(
      "collaboration:apply-approval-policy-recommendation",
      actor,
      { recommendationId: "rec_1" },
      { dryRun: false },
      {
        applyApprovalPolicyRecommendationChange,
        rollbackApprovalPolicyPromotion,
      },
    );
    expect(applied).toEqual({ ok: true, output: "applied" });
    expect(applyApprovalPolicyRecommendationChange).toHaveBeenCalledWith(
      actor,
      { recommendationId: "rec_1" },
      { dryRun: false },
      { persistPromotion: false },
    );

    const promoted = runApprovalPolicyAction(
      "collaboration:promote-approval-policy-recommendation",
      actor,
      { recommendationId: "rec_2" },
      {},
      {
        applyApprovalPolicyRecommendationChange,
        rollbackApprovalPolicyPromotion,
      },
    );
    expect(promoted).toEqual({ ok: true, output: "applied" });
    expect(applyApprovalPolicyRecommendationChange).toHaveBeenLastCalledWith(
      actor,
      { recommendationId: "rec_2" },
      {},
      { persistPromotion: true },
    );

    const rolledBack = runApprovalPolicyAction(
      "collaboration:rollback-approval-policy",
      actor,
      { promotionId: "promo_1" },
      { dryRun: true },
      {
        applyApprovalPolicyRecommendationChange,
        rollbackApprovalPolicyPromotion,
      },
    );
    expect(rolledBack).toEqual({ ok: true, output: "rolled back" });
    expect(rollbackApprovalPolicyPromotion).toHaveBeenCalledWith(actor, { promotionId: "promo_1" }, { dryRun: true });
  });

  it("wraps trust alert and recommendation follow-up actions with audit-friendly messages", () => {
    const acknowledged = acknowledgeTrustAlert(
      actor,
      { alertId: "alert_1" },
      {
        acknowledgeApprovalTrustAlert: vi.fn(() => ({ ok: true, output: "done" })),
      },
    );
    expect(acknowledged).toEqual(
      expect.objectContaining({
        ok: true,
        audit: {
          message: "Acknowledged trust alert alert_1.",
          payload: { alertId: "alert_1" },
        },
      }),
    );

    const restarted = restartRecommendationObservation(
      actor,
      { recommendationId: "rec_1" },
      {
        restartApprovalRecommendationObservation: vi.fn(() => ({ ok: false, error: "missing recommendation" })),
      },
    );
    expect(restarted).toEqual(
      expect.objectContaining({
        ok: false,
        error: "missing recommendation",
        audit: {
          message: "Failed to restart approval observation.",
          payload: { recommendationId: "rec_1" },
        },
      }),
    );

    const extended = extendRecommendationCooldown(
      actor,
      { recommendationId: "rec_2" },
      {
        extendApprovalRecommendationCooldown: vi.fn(() => ({ ok: true, output: "extended" })),
      },
    );
    expect(extended).toEqual(
      expect.objectContaining({
        ok: true,
        audit: {
          message: "Extended cooldown for rec_2.",
          payload: { recommendationId: "rec_2" },
        },
      }),
    );
  });
});
