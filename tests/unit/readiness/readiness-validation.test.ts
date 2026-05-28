import { describe, expect, it } from "vitest";

import { validateConstitutionalReadiness } from "@/services/readiness/readinessValidation";

describe("validateConstitutionalReadiness", () => {
  it("blocks readiness when disputed truth or audit gaps exist", () => {
    const result = validateConstitutionalReadiness({
      governanceReliability: 0.82,
      auditIntegrity: 0.41,
      containmentSurvivability: 0.73,
      escalationCoordinationReliability: 0.7,
      simulationTrustworthiness: 0.77,
      continuityStability: 0.69,
      operatorOverrideReliability: 0.81,
      enforcementConsistency: 0.8,
      operationalExplainability: 0.75,
      deterministicRecoveryConfidence: 0.8,
      disputedSignals: ["replay_mismatch"],
      inheritedConstraints: [],
    });

    expect(result.valid).toBe(false);
    expect(result.blockingRisks).toContain("READINESS_BLOCKED_BY_DISPUTED_TRUTH");
    expect(result.blockingRisks).toContain("READINESS_BLOCKED_BY_AUDIT_INTEGRITY");
  });
});
