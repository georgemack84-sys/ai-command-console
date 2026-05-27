import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/recovery/verification/recoveryVerificationReadModel", () => ({
  buildRecoveryDashboardReadModel: vi.fn(),
}));

import { buildRecoveryDashboardReadModel } from "@/services/recovery/verification/recoveryVerificationReadModel";
import { buildStewardshipDashboardModel } from "@/services/stewardship/stewardshipDashboardModel";

describe("buildStewardshipDashboardModel", () => {
  it("fails closed when dashboard state is stale", async () => {
    vi.mocked(buildRecoveryDashboardReadModel).mockResolvedValue({
      runtimeContinuityState: "RECOVERING",
      continuityConfidence: 0.5,
      operationalStability: "degraded",
      degradedSystems: [],
      activeRecoveries: [],
      pendingApprovals: [],
      blockedRecoveries: [],
      quarantinedExecutions: [],
      replayVerificationState: "VERIFIED",
      replayDivergenceCount: 0,
      leaseConflicts: [],
      auditHistory: [],
      governanceDisputes: [],
      certificationState: "CERTIFIED",
      simulationOutcomes: [],
      continuityRiskScore: 25,
      stewardship: null,
      operationalStabilityAssessment: null,
      escalationCoordination: null,
      continuityConvergence: null,
      recoveryPrioritization: null,
      generatedAt: "2026-05-09T00:00:00.000Z",
    } as never);

    const model = await buildStewardshipDashboardModel({
      tenantContext: { tenantId: "tenant_1", workspaceId: "workspace_1", source: "session", isolationVersion: "3.6G" } as never,
      nowMs: Date.parse("2026-05-09T00:10:00.000Z"),
    });

    expect(model.stale).toBe(true);
    expect(model.controlsHidden).toBe(true);
    expect(model.view.resilience.requiresFreeze).toBe(true);
    expect(model.decision.mutable).toBe(false);
    expect(model.decision.constitutionalAction).toBe("DENY");
    expect(model.readiness.advisoryOnly).toBe(true);
    expect(model.readiness.liveAutonomyEnabled).toBe(false);
  });
});
