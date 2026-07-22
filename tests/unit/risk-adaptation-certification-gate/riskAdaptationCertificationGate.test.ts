import { describe, expect, it } from "vitest";
import { certifyRiskAdaptation, getRiskAdaptationCertificationFoundation, replayRiskAdaptationCertification } from "@/services/risk-adaptation-certification-gate";
import type { RiskAdaptationCertificationFailure, RiskAdaptationCertificationScenario } from "@/types/risk-adaptation-certification-gate";

describe("Mission Control Phase 10.7.10 Risk Adaptation Certification Gate", () => {
  it("publishes the risk adaptation certification foundation", () => {
    const foundation = getRiskAdaptationCertificationFoundation();

    expect(foundation.risk_adaptation_certification_gate_version).toBe("risk-adaptation-certification-gate/v1");
    expect(foundation.api_surface.certify).toBe("POST /risk-adaptation-certification-gate/certify");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("passes certification for the complete Phase 10.7 stack", () => {
    const result = certifyRiskAdaptation();

    expect(result.record.outcome).toBe("PASS");
    expect(result.validation.certified).toBe(true);
    expect(result.production_safe).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.record.certified_components.length).toBe(9);
  });

  it("is deterministic", () => {
    const first = certifyRiskAdaptation();
    const second = certifyRiskAdaptation();

    expect(first.record.certification_id).toBe(second.record.certification_id);
    expect(first.record.outcome).toBe(second.record.outcome);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports conditional pass while blocking certification", () => {
    const result = certifyRiskAdaptation({ scenario: "CONDITIONAL" });

    expect(result.record.outcome).toBe("CONDITIONAL_PASS");
    expect(result.validation.certified).toBe(false);
    expect(result.validation.state).toBe("FAILED");
  });

  it("builds a complete immutable evidence package", () => {
    const result = certifyRiskAdaptation();

    expect(result.evidence_package.immutable).toBe(true);
    expect(result.evidence_package.replayable).toBe(true);
    expect(result.evidence_package.integrity_hashes.length).toBe(9);
    expect(result.evidence_package.certification_lineage_refs.length).toBeGreaterThan(0);
  });

  it("executes certification tests across all validation areas", () => {
    const result = certifyRiskAdaptation();

    expect(result.record.certification_tests.map((test) => test.area)).toEqual([
      "DETERMINISM",
      "EVIDENCE",
      "GOVERNANCE",
      "CONSTITUTIONAL",
      "SIMULATION",
      "LEDGER",
      "DASHBOARD",
      "REPLAY",
      "TENANT_ISOLATION",
      "PRODUCTION_READINESS",
    ]);
    expect(result.record.certification_tests.every((test) => test.actual === "PASS")).toBe(true);
  });

  it("replays certification", () => {
    const result = certifyRiskAdaptation();

    expect(replayRiskAdaptationCertification(result)).toBe(true);
  });

  it.each([
    ["MISSING_COMPONENT", "COMPONENT_CERTIFICATION_MISSING"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_RECOMMENDATION_GENERATION"],
    ["UNSUPPORTED_RECALIBRATION", "UNSUPPORTED_RECALIBRATION_PROPOSAL"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["SCORING_INCONSISTENCY", "RISK_SCORING_INCONSISTENT"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HISTORICAL_MUTATION", "HISTORICAL_RECORD_MODIFICATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_ESCALATION", "UNAUTHORIZED_AUTHORITY_ESCALATION"],
    ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_MISSING"],
    ["MISSING_SIMULATION", "HIGH_IMPACT_SIMULATION_MISSING"],
    ["PRODUCTION_MUTATION", "AUTOMATIC_PRODUCTION_MUTATION_DETECTED"],
    ["CONFIGURATION_CHANGE", "UNAUTHORIZED_PRODUCTION_CONFIGURATION_CHANGE"],
    ["LEDGER_FAILURE", "LEDGER_INTEGRITY_FAILURE"],
    ["HASH_MISMATCH", "HASH_VERIFICATION_FAILURE"],
    ["REPLAY_GAP", "REPLAY_LINEAGE_GAP"],
    ["CERTIFICATION_GAP", "CERTIFICATION_LINEAGE_GAP"],
    ["ROLLBACK_GAP", "ROLLBACK_LINEAGE_GAP"],
    ["CROSS_TENANT", "CROSS_TENANT_DATA_LEAKAGE"],
    ["AUDIT_GAP", "AUDIT_TRAIL_INCOMPLETE"],
    ["EXPLAINABILITY_GAP", "EXPLAINABILITY_DEFICIENCY"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILURE"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["AUTONOMOUS_LEARNING", "AUTONOMOUS_LEARNING_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskAdaptationCertificationScenario, RiskAdaptationCertificationFailure][])("fails certification for %s", (scenario, failure) => {
    const result = certifyRiskAdaptation({ scenario });

    expect(result.record.outcome).toBe("FAIL");
    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
  });

  it("marks replay failures as pending replay", () => {
    const result = certifyRiskAdaptation({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects production mutation and autonomous learning", () => {
    expect(certifyRiskAdaptation({ scenario: "PRODUCTION_MUTATION" }).validation.state).toBe("REJECTED");
    expect(certifyRiskAdaptation({ scenario: "AUTONOMOUS_LEARNING" }).record.outcome).toBe("FAIL");
  });

  it("detects replay tampering", () => {
    const result = certifyRiskAdaptation();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskAdaptationCertification(tampered)).toBe(false);
  });
});
