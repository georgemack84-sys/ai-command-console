import { describe, expect, it } from "vitest";

import { evaluateAutonomousRecoveryReadiness } from "@/services/readiness/autonomousRecoveryReadiness";

describe("evaluateAutonomousRecoveryReadiness", () => {
  it("always remains advisory-only and requires operator approval", () => {
    const result = evaluateAutonomousRecoveryReadiness({
      constitutionalEnforcement: {
        constitutionalAction: "WARN",
        constitutionallyAllowed: true,
        constitutionalViolations: [],
      },
      decisionIntelligence: {
        decisionId: "decision_1",
        executionId: "exec_1",
        constitutionalAction: "WARN",
        constitutionallyAllowed: true,
        requiresApproval: true,
        reasons: [],
        blockedReasons: [],
      },
      simulationForecast: {
        advisoryOnly: true,
        evidenceSufficient: true,
        governanceInstabilityRisk: 0.18,
        containmentPressure: 0.2,
        simulations: [
          { simulationType: "ROLLBACK", confidenceScore: 0.82, uncertaintyLevel: "LOW" },
        ],
      },
      simulationLineage: ["simulation:rollback", "execution:exec_1"],
      convergence: { converged: true, continuityConfidence: 0.86, divergenceScore: 0.12, requiresFreeze: false },
      stability: { confidence: 0.82, disputed: false, stabilizationRequired: false },
      escalation: { blocked: false, frozen: false, confidence: 0.81 },
      containment: { confidence: 0.84, requiresContainment: false },
      rollback: { guaranteed: true, confidence: 0.88 },
      auditEvidence: [{ id: "audit_1" }, { id: "audit_2" }, { id: "audit_3" }],
    });

    expect(result.advisoryOnly).toBe(true);
    expect(result.liveAutonomyEnabled).toBe(false);
    expect(result.requiresOperatorApproval).toBe(true);
  });

  it("blocks readiness during constitutional freeze", () => {
    const result = evaluateAutonomousRecoveryReadiness({
      constitutionalEnforcement: {
        constitutionalAction: "FREEZE",
        constitutionallyAllowed: false,
        constitutionalViolations: ["freeze_authority_enforced"],
      },
      decisionIntelligence: {
        decisionId: "decision_1",
        executionId: "exec_1",
        constitutionalAction: "FREEZE",
        constitutionallyAllowed: false,
        requiresApproval: true,
        reasons: ["operator_freeze_enforced"],
        blockedReasons: ["freeze_authority_enforced"],
      },
      simulationForecast: {
        advisoryOnly: true,
        evidenceSufficient: true,
        governanceInstabilityRisk: 0.5,
        containmentPressure: 0.5,
        simulations: [],
      },
      simulationLineage: ["simulation:rollback"],
      convergence: { converged: false, continuityConfidence: 0.4, divergenceScore: 0.6, requiresFreeze: true },
      stability: { confidence: 0.4, disputed: false, stabilizationRequired: true },
      escalation: { blocked: false, frozen: false, confidence: 0.4 },
      containment: { confidence: 0.4, requiresContainment: true },
      rollback: { guaranteed: true, confidence: 0.7 },
      auditEvidence: [{ id: "audit_1" }],
    });

    expect(result.readinessState).toBe("CONSTITUTIONALLY_BLOCKED");
    expect(result.autonomyBlockedReasons).toContain("READINESS_BLOCKED_BY_FREEZE");
  });

  it("blocks readiness when rollback guarantees are missing", () => {
    const result = evaluateAutonomousRecoveryReadiness({
      constitutionalEnforcement: {
        constitutionalAction: "WARN",
        constitutionallyAllowed: true,
        constitutionalViolations: [],
      },
      decisionIntelligence: {
        decisionId: "decision_1",
        executionId: "exec_1",
        constitutionalAction: "WARN",
        constitutionallyAllowed: true,
        requiresApproval: true,
        reasons: [],
        blockedReasons: [],
      },
      simulationForecast: {
        advisoryOnly: true,
        evidenceSufficient: true,
        governanceInstabilityRisk: 0.2,
        containmentPressure: 0.2,
        simulations: [],
      },
      simulationLineage: ["simulation:rollback"],
      convergence: { converged: true, continuityConfidence: 0.85, divergenceScore: 0.15, requiresFreeze: false },
      stability: { confidence: 0.8, disputed: false, stabilizationRequired: false },
      escalation: { blocked: false, frozen: false, confidence: 0.8 },
      containment: { confidence: 0.84, requiresContainment: false },
      rollback: { guaranteed: false, confidence: 0.2 },
      auditEvidence: [{ id: "audit_1" }, { id: "audit_2" }],
    });

    expect(result.readinessState).toBe("NOT_READY");
    expect(result.autonomyBlockedReasons).toContain("READINESS_BLOCKED_BY_MISSING_ROLLBACK");
  });

  it("treats disputed truth as blocking", () => {
    const result = evaluateAutonomousRecoveryReadiness({
      constitutionalEnforcement: {
        constitutionalAction: "DENY",
        constitutionallyAllowed: false,
        constitutionalViolations: ["disputed_truth_blocks_recovery"],
      },
      decisionIntelligence: {
        decisionId: "decision_1",
        executionId: "exec_1",
        constitutionalAction: "DENY",
        constitutionallyAllowed: false,
        requiresApproval: true,
        reasons: ["governance_dispute_present"],
        blockedReasons: ["disputed_truth_blocks_recovery"],
      },
      simulationForecast: {
        advisoryOnly: true,
        evidenceSufficient: false,
        governanceInstabilityRisk: 0.6,
        containmentPressure: 0.4,
        simulations: [],
      },
      simulationLineage: [],
      convergence: { converged: false, continuityConfidence: 0.3, divergenceScore: 0.7, requiresFreeze: false },
      stability: { confidence: 0.4, disputed: true, stabilizationRequired: true },
      escalation: { blocked: true, frozen: true, confidence: 0.3 },
      containment: { confidence: 0.4, requiresContainment: true },
      rollback: { guaranteed: true, confidence: 0.6 },
      auditEvidence: [{ id: "audit_1" }],
    });

    expect(["DISPUTED", "CONSTITUTIONALLY_BLOCKED"]).toContain(result.readinessState);
    expect(result.autonomyBlockedReasons).toContain("READINESS_BLOCKED_BY_DISPUTED_TRUTH");
  });
});
