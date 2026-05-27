import { describe, expect, it } from "vitest";

import { runConstitutionalEnforcementRuntime } from "@/services/enforcement/constitutionalEnforcementRuntime";

describe("collapsing state runtime freeze", () => {
  it("applies containment during collapsing state", () => {
    const result = runConstitutionalEnforcementRuntime({
      governance: {
        allowed: false,
        constitutionalState: "RESTRICTED",
        governanceConfidence: 0.49,
        violations: [],
        escalationRequired: true,
        containmentRequired: true,
      },
      sovereignty: {
        sovereigntyState: "COLLAPSING",
        governanceIntegrity: 0.24,
        survivabilityConfidence: 0.18,
        systemicRisk: 0.9,
        containmentEffectiveness: 0.28,
        escalationPressure: 0.88,
        emergencyControlsRequired: true,
        unstableDomains: ["survivability_loss"],
      },
      continuity: {
        survivable: false,
        collapseRisk: 0.91,
        containmentConfidence: 0.27,
      },
      coordination: {
        constitutionalSafe: false,
        coordinationState: "CONTAINED",
        escalationRequired: true,
        route: ["containment_precedence"],
      },
      validation: {
        valid: false,
        freezeActivated: true,
        blockedReasons: ["validation_freeze_required"],
      },
      escalationLineagePresent: true,
      immutableAuditAvailable: true,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.executable).toBe(false);
    expect(result.containmentApplied).toBe(true);
    expect(result.enforcementState).toBe("CONTAINMENT_ACTIVE");
  });
});
