import { describe, expect, it } from "vitest";

import { runConstitutionalEnforcementRuntime } from "@/services/enforcement/constitutionalEnforcementRuntime";

describe("disputed truth runtime block", () => {
  it("blocks execution when disputed truth is unresolved", () => {
    const result = runConstitutionalEnforcementRuntime({
      governance: {
        allowed: false,
        constitutionalState: "DISPUTED",
        governanceConfidence: 0.41,
        violations: ["disputed_truth_detected"],
        escalationRequired: true,
        containmentRequired: true,
      },
      sovereignty: {
        sovereigntyState: "EMERGENCY_CONTAINMENT",
        governanceIntegrity: 0.18,
        survivabilityConfidence: 0.14,
        systemicRisk: 0.96,
        containmentEffectiveness: 0.2,
        escalationPressure: 0.92,
        emergencyControlsRequired: true,
        unstableDomains: ["constitutional_degradation"],
      },
      continuity: {
        survivable: false,
        collapseRisk: 0.95,
        containmentConfidence: 0.2,
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
      escalationLineagePresent: false,
      immutableAuditAvailable: true,
      timestamp: "2026-05-09T00:00:00.000Z",
    });

    expect(result.blockedReasons).toContain("disputed_truth_blocks_execution");
    expect(result.executable).toBe(false);
  });
});
