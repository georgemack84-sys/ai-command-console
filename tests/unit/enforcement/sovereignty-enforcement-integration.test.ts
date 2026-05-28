import { describe, expect, it } from "vitest";

import { runConstitutionalEnforcementRuntime } from "@/services/enforcement/constitutionalEnforcementRuntime";

describe("sovereignty enforcement integration", () => {
  it("freezes execution in CRITICAL sovereignty state", () => {
    const result = runConstitutionalEnforcementRuntime({
      governance: {
        allowed: true,
        constitutionalState: "CONSTITUTIONAL",
        governanceConfidence: 0.82,
        violations: [],
        escalationRequired: false,
        containmentRequired: false,
      },
      sovereignty: {
        sovereigntyState: "CRITICAL",
        governanceIntegrity: 0.31,
        survivabilityConfidence: 0.45,
        systemicRisk: 0.71,
        containmentEffectiveness: 0.58,
        escalationPressure: 0.62,
        emergencyControlsRequired: true,
        unstableDomains: ["survivability_loss"],
      },
      continuity: {
        survivable: false,
        collapseRisk: 0.68,
        containmentConfidence: 0.58,
      },
      coordination: {
        constitutionalSafe: false,
        coordinationState: "SUPERVISED",
        escalationRequired: false,
        route: ["governance_review"],
      },
      validation: {
        valid: true,
        freezeActivated: false,
        blockedReasons: [],
      },
      escalationLineagePresent: true,
      immutableAuditAvailable: true,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.executable).toBe(false);
    expect(result.blockedReasons).toContain("sovereignty_state_blocks_execution");
  });
});
