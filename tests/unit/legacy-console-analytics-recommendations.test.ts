import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  buildWorkspaceBackupApproverSuggestion,
  buildRecommendationConfidence,
  buildApprovalPolicyRecommendations,
  summarizeApprovalPolicyRecommendationEffect,
  buildApprovalPolicyMetricsSnapshot,
  evaluateAppliedApprovalPolicyImpact,
} = require("../../services/legacyConsoleAnalyticsRecommendations.js");

describe("legacy console analytics recommendations", () => {
  it("suggests the least-loaded eligible backup approver outside current targets", () => {
    const deps = {
      normalizeTarget: (value: string | null) => (value ? String(value) : ""),
      normalizeRole: (role: string) => role,
      listWorkspaceUsers: vi.fn(() => [
        { id: "owner", name: "Owner", role: "admin" },
        { id: "backup", name: "Backup", role: "approver" },
        { id: "viewer", name: "Viewer", role: "viewer" },
      ]),
    };

    const suggestion = buildWorkspaceBackupApproverSuggestion(
      "alpha",
      [{ workspaceId: "alpha", incidentApproverTarget: "user:owner", backupApproverTarget: null }],
      { targets: [{ target: "user:backup", pending: 1, averageApprovalMs: 60_000 }] },
      deps,
    );

    expect(suggestion).toBe("user:backup");
  });

  it("builds confidence labels and recommendation payloads", () => {
    expect(
      buildRecommendationConfidence("capacity", {
        pressureEntry: { finalEscalatedCount: 2, overdueCount: 3 },
      }),
    ).toEqual({ score: 0.98, label: "high" });

    const recommendations = buildApprovalPolicyRecommendations(
      [{ target: "user:owner", overdueCount: 3, finalEscalatedCount: 1 }],
      {
        targets: [{ target: "user:owner", averageApprovalMs: 45 * 60 * 1000, pending: 2 }],
        workspaces: [{ workspaceId: "alpha", workspaceName: "Alpha", autoRerouted: 1, rerouted: 2 }],
      },
      { currentEnvironment: "production", incidentApprovalCapacityLimit: 2 },
      [{ workspaceId: "alpha", incidentApproverTarget: "user:owner", backupApproverTarget: null }],
      {
        normalizeTarget: (value: string | null) => (value ? String(value) : ""),
        normalizeRole: (role: string) => role,
        listWorkspaceUsers: () => [{ id: "backup", name: "Backup", role: "approver" }],
      },
    );

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        id: "approval-policy-pressure:user:owner",
        kind: "capacity",
      }),
    );
    expect(recommendations[2].action.payload).toEqual(
      expect.objectContaining({
        workspaceId: "alpha",
        suggestedBackupApproverTarget: "user:backup",
      }),
    );
  });

  it("builds metrics snapshots and evaluates rollout impact", () => {
    const metrics = buildApprovalPolicyMetricsSnapshot(
      { target: "user:owner", workspaceId: "alpha" },
      {
        getDigestSchedulerStatus: () => ({ enabled: true }),
        buildDigestWorkspaceHealth: () => [{ workspaceId: "alpha" }],
        loadCollaborationState: () => ({ approvals: [] }),
        buildIncidentApprovalPressure: () => [{ target: "user:owner", overdueCount: 4, pendingCount: 5 }],
        buildApprovalThroughputAnalytics: () => ({
          targets: [{ target: "user:owner", averageApprovalMs: 30 * 60 * 1000, pending: 3 }],
          workspaces: [{ workspaceId: "alpha", averageApprovalMs: 25 * 60 * 1000, autoRerouted: 1 }],
        }),
      },
    );

    expect(metrics).toEqual({
      targetPressure: { target: "user:owner", overdueCount: 4, pendingCount: 5 },
      targetThroughput: { target: "user:owner", averageApprovalMs: 30 * 60 * 1000, pending: 3 },
      workspaceThroughput: { workspaceId: "alpha", averageApprovalMs: 25 * 60 * 1000, autoRerouted: 1 },
    });

    const impact = evaluateAppliedApprovalPolicyImpact(
      {
        target: "user:owner",
        workspaceId: "alpha",
        metricsSnapshot: {
          targetPressure: { overdueCount: 4, pendingCount: 5 },
          targetThroughput: { averageApprovalMs: 30 * 60 * 1000, pending: 3 },
          workspaceThroughput: { autoRerouted: 2 },
        },
      },
      [{ target: "user:owner", overdueCount: 2, pendingCount: 2 }],
      {
        targets: [{ target: "user:owner", averageApprovalMs: 20 * 60 * 1000, pending: 2 }],
        workspaces: [{ workspaceId: "alpha", autoRerouted: 0 }],
      },
    );

    expect(impact.status).toBe("improved");
    expect(impact.summary).toBe("Overdue approvals dropped from 4 to 2.");
    expect(impact.comparison).toEqual(
      expect.objectContaining({
        overdueDelta: -2,
        pendingDelta: -3,
        averageApprovalMinutesBefore: 30,
        averageApprovalMinutesAfter: 20,
        autoReroutesBefore: 2,
        autoReroutesAfter: 0,
      }),
    );
  });

  it("summarizes recommendation effects for capacity and backup approver changes", () => {
    expect(
      summarizeApprovalPolicyRecommendationEffect(
        { workspaceId: "alpha", suggestedCapacityLimit: 2, environment: "staging" },
        { backupApproverTarget: "user:backup" },
      ),
    ).toBe("Assigned user:backup as the backup approver for alpha.");

    expect(
      summarizeApprovalPolicyRecommendationEffect(
        { suggestedCapacityLimit: 2, environment: "staging" },
        { capacityLimit: 1, environment: "production" },
      ),
    ).toBe("Set the production approval capacity limit to 1.");
  });
});
