import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  summarizeWorkspacePolicyOverride,
  normalizePolicyPlaybookPayload,
  listDefaultPolicyPlaybookPresets,
  summarizePolicyPlaybookRollouts,
  buildPolicyPlaybookAdoptionSummary,
  buildGlobalOperationsSummary,
} = require("../../services/legacyConsoleAnalyticsPlaybooks.js");

describe("legacy console analytics playbook helpers", () => {
  it("summarizes workspace overrides and normalizes playbook payloads", () => {
    expect(
      summarizeWorkspacePolicyOverride({
        environment: "production",
        requireApprovalForResolved: true,
        requireApprovalForArchived: false,
        incidentApprovalCapacityLimit: 1,
        trustDropAction: "followup",
      }),
    ).toBe("env production • resolve approval on • archive approval off • capacity 1");

    expect(normalizePolicyPlaybookPayload({}, { id: "user_1", name: "Alex" })).toEqual({
      ok: false,
      error: "Playbook name is required.",
    });

    const normalized = normalizePolicyPlaybookPayload(
      {
        name: " Production Recovery ",
        environment: "production",
        incidentApprovalCapacityLimit: 2,
        trustDropAction: "followup",
        requireApprovalForResolved: true,
        promoteTrustDropToIncident: true,
      },
      { id: "user_1", name: "Alex" },
    );

    expect(normalized.ok).toBe(true);
    expect(normalized.playbook).toEqual(
      expect.objectContaining({
        name: "Production Recovery",
        environment: "production",
        incidentApprovalCapacityLimit: 2,
        updatedById: "user_1",
        updatedByName: "Alex",
      }),
    );
  });

  it("lists presets and summarizes rollout history by environment", () => {
    const presets = listDefaultPolicyPlaybookPresets();
    expect(presets).toHaveLength(3);
    expect(presets[0]).toEqual(
      expect.objectContaining({
        id: "preset_development_watch",
        environment: "development",
      }),
    );

    const summary = summarizePolicyPlaybookRollouts([
      { appliedAt: "2026-04-09T01:00:00.000Z", environment: "staging" },
      { appliedAt: "2026-04-09T03:00:00.000Z", environment: "production" },
      { appliedAt: "2026-04-09T02:00:00.000Z", environment: "staging" },
    ]);

    expect(summary.recent.map((item: { environment: string }) => item.environment)).toEqual([
      "production",
      "staging",
      "staging",
    ]);
    expect(summary.byEnvironment).toEqual(
      expect.arrayContaining([
        { environment: "staging", rolloutCount: 2 },
        { environment: "production", rolloutCount: 1 },
      ]),
    );
  });

  it("builds playbook adoption summaries and recommendations", () => {
    const adoption = buildPolicyPlaybookAdoptionSummary(
      [
        {
          playbookId: "preset_development_watch",
          playbookName: "Development Watch",
          environment: "development",
          workspaceCount: 2,
          workspaceIds: ["alpha", "beta"],
          appliedAt: "2026-04-09T01:00:00.000Z",
        },
        {
          playbookId: "custom_1",
          playbookName: "Custom Tighten",
          environment: "production",
          workspaceCount: 1,
          workspaceIds: ["gamma"],
          appliedAt: "2026-04-09T02:00:00.000Z",
        },
      ],
      [],
      [{ id: "preset_development_watch", environment: "development" }],
      [
        { workspaceId: "alpha", status: "healthy", incidentStatus: "resolved" },
        { workspaceId: "beta", status: "error", incidentStatus: "active" },
        { workspaceId: "gamma", status: "stalled", incidentStatus: "active" },
      ],
      [{ workspaceId: "alpha" }],
    );

    expect(adoption.totalTracked).toBe(2);
    expect(adoption.presetCount).toBe(1);
    expect(adoption.items[0]).toEqual(
      expect.objectContaining({
        playbookName: "Development Watch",
        source: "preset",
        rolloutCount: 1,
        workspaceCount: 2,
        recoveredWorkspaceCount: 1,
        activeRiskWorkspaceCount: 1,
        completedTrustCount: 1,
      }),
    );
    expect(adoption.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "prefer",
          playbookName: "Development Watch",
        }),
        expect.objectContaining({
          kind: "review",
          playbookName: "Custom Tighten",
        }),
      ]),
    );
  });

  it("builds global operations summary totals, environments, hotspots, and pressure targets", () => {
    const summary = buildGlobalOperationsSummary(
      [
        {
          workspaceId: "alpha",
          workspaceName: "Alpha",
          status: "error",
          incidentStatus: "active",
          hasPolicyOverride: true,
          policyOverrideSummary: "env production",
          dueUsers: 2,
          overdueIntervals: 4,
          incidentApproval: { state: "pending", approverTarget: "user:owner" },
          incidentApprovalSla: { finalEscalated: true },
          incidentPolicy: { environment: "production" },
        },
        {
          workspaceId: "beta",
          workspaceName: "Beta",
          status: "healthy",
          incidentStatus: "resolved",
          hasPolicyOverride: false,
          dueUsers: 0,
          overdueIntervals: 0,
          incidentApproval: { state: "approved" },
          incidentPolicy: { environment: "staging" },
        },
      ],
      [{ workspaceId: "alpha" }],
      [{ target: "user:owner", pendingCount: 2, overdueCount: 1, finalEscalatedCount: 1, workspaces: ["alpha"] }],
      [{ environment: "production", score: 72 }, { environment: "staging", score: 88 }],
      [{ environment: "production" }, { environment: "production" }],
      [{ workspaceId: "alpha", environment: "production" }],
      [{ appliedAt: "2026-04-09T03:00:00.000Z", environment: "production" }],
    );

    expect(summary.totals).toEqual(
      expect.objectContaining({
        workspaceCount: 2,
        overriddenWorkspaces: 1,
        unhealthyWorkspaces: 1,
        openIncidents: 1,
        pendingApprovals: 1,
        finalEscalations: 1,
        activeTrustSignals: 2,
        activeDigestEscalations: 1,
        completedTrustIncidents: 1,
        playbookRollouts: 1,
      }),
    );
    expect(summary.environments[0]).toEqual(
      expect.objectContaining({
        environment: "production",
        workspaceCount: 1,
        overrideCount: 1,
        unhealthyCount: 1,
        activeTrustSignals: 2,
        completedTrustIncidents: 1,
        playbookRollouts: 1,
      }),
    );
    expect(summary.hotspots[0]).toEqual(
      expect.objectContaining({
        workspaceId: "alpha",
        finalEscalated: true,
      }),
    );
    expect(summary.pressureTargets[0]).toEqual(
      expect.objectContaining({
        target: "user:owner",
        pendingCount: 2,
        overdueCount: 1,
        finalEscalatedCount: 1,
      }),
    );
  });
});
