import { describe, expect, it } from "vitest";

import { runConstitutionalEnforcementRuntime } from "@/services/enforcement/constitutionalEnforcementRuntime";

describe("emergency containment runtime enforcement", () => {
  it("emergency lock overrides approval", () => {
    const result = runConstitutionalEnforcementRuntime({
      governance: {
        allowed: true,
        constitutionalState: "CONSTITUTIONAL",
        governanceConfidence: 0.85,
        violations: [],
        escalationRequired: false,
        containmentRequired: false,
      },
      sovereignty: {
        sovereigntyState: "EMERGENCY_CONTAINMENT",
        governanceIntegrity: 0.12,
        survivabilityConfidence: 0.11,
        systemicRisk: 0.99,
        containmentEffectiveness: 0.14,
        escalationPressure: 0.93,
        emergencyControlsRequired: true,
        unstableDomains: ["containment"],
      },
      continuity: {
        survivable: false,
        collapseRisk: 0.97,
        containmentConfidence: 0.12,
      },
      coordination: {
        constitutionalSafe: false,
        coordinationState: "CONTAINED",
        escalationRequired: true,
        route: ["containment_precedence"],
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

    expect(result.emergencyLockActive).toBe(true);
    expect(result.executable).toBe(false);
  });
});
