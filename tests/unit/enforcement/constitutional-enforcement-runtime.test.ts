import { describe, expect, it } from "vitest";

import { runConstitutionalEnforcementRuntime } from "@/services/enforcement/constitutionalEnforcementRuntime";

describe("runConstitutionalEnforcementRuntime", () => {
  it("blocks execution on constitutional denial", () => {
    const result = runConstitutionalEnforcementRuntime({
      governance: {
        allowed: false,
        constitutionalState: "DENIED",
        governanceConfidence: 0.28,
        violations: ["disputed_truth_blocks_recovery"],
        escalationRequired: true,
        containmentRequired: true,
      },
      sovereignty: {
        sovereigntyState: "CRITICAL",
        governanceIntegrity: 0.25,
        survivabilityConfidence: 0.22,
        systemicRisk: 0.8,
        containmentEffectiveness: 0.32,
        escalationPressure: 0.79,
        emergencyControlsRequired: true,
        unstableDomains: ["governance_integrity"],
      },
      continuity: {
        survivable: false,
        collapseRisk: 0.83,
        containmentConfidence: 0.35,
      },
      coordination: {
        constitutionalSafe: false,
        coordinationState: "CONTAINED",
        escalationRequired: true,
        route: ["governance_review"],
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

    expect(result.executable).toBe(false);
    expect(result.blockedReasons).toContain("constitutional_denial_active");
  });
});
