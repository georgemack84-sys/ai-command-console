import { describe, expect, it } from "vitest";

import { runStewardshipValidationEngine } from "@/services/validation/stewardshipValidationEngine";

describe("runStewardshipValidationEngine", () => {
  it("aggregates adversarial validation without granting authority", () => {
    const result = runStewardshipValidationEngine({
      readiness: {
        advisoryOnly: true,
        liveAutonomyEnabled: false,
        requiresOperatorApproval: true,
        containmentConfidence: 0.82,
      },
      simulationForecast: {
        advisoryOnly: true,
        simulations: [{ simulationType: "ROLLBACK" }],
      },
      decisionIntelligence: {
        mutable: false,
        forecastLineageIds: ["lineage_1"],
      },
      dashboard: { readOnly: true },
      rollback: { guaranteed: true },
      convergence: { converged: true, requiresContainment: false },
      resilience: { requiresContainment: false },
      escalationCoordination: {
        frozen: false,
        blocked: false,
        conflictingEscalations: [],
        escalationLineageId: "lineage_1",
        requiresOperatorVisibility: true,
      },
      replayVerificationState: "VERIFIED",
      replayDivergenceCount: 0,
      immutableEvidenceValid: true,
      simulationLineage: ["simulation:rollback"],
      auditEvidence: [{ id: "audit_1" }],
      conditions: [],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.valid).toBe(true);
    expect(result.advisoryBoundaryIntact).toBe(true);
    expect(result.runtimeMutationDetected).toBe(false);
    expect(result.auditRecords[0]?.eventType).toBe("validation.started");
  });

  it("freezes validation when disputed truth is present", () => {
    const result = runStewardshipValidationEngine({
      readiness: {
        advisoryOnly: true,
        liveAutonomyEnabled: false,
        requiresOperatorApproval: true,
        containmentConfidence: 0.3,
      },
      simulationForecast: {
        advisoryOnly: true,
        simulations: [],
      },
      decisionIntelligence: {
        mutable: false,
        forecastLineageIds: [],
      },
      dashboard: { readOnly: true },
      rollback: { guaranteed: false },
      convergence: { converged: false, requiresContainment: true },
      resilience: { requiresContainment: true },
      escalationCoordination: {
        frozen: true,
        blocked: true,
        conflictingEscalations: ["esc_2"],
        escalationLineageId: "lineage_1",
        requiresOperatorVisibility: true,
      },
      replayVerificationState: "DIVERGED",
      replayDivergenceCount: 2,
      immutableEvidenceValid: false,
      simulationLineage: [],
      auditEvidence: [],
      conditions: ["replay_corruption", "governance_outage"],
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.valid).toBe(false);
    expect(result.freezeActivated).toBe(true);
    expect(result.blockedReasons).toContain("replay_corruption_detected");
    expect(result.blockedReasons).toContain("validation_freeze_required");
  });
});
