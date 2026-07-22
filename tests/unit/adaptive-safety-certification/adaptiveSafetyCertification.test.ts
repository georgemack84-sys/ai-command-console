import { describe, expect, it } from "vitest";

import {
  certifyAdaptiveSafety,
  getAdaptiveSafetyContract,
  replayAdaptiveSafetyCertification,
  validateAdaptiveSafetyCertification,
} from "../../../services/adaptive-safety-certification";
import type { AdaptiveSafetyFailure, AdaptiveSafetyScenario } from "../../../types/adaptive-safety-certification";

const failureScenarios: ReadonlyArray<readonly [AdaptiveSafetyScenario, AdaptiveSafetyFailure]> = [
  ["HIDDEN_LEARNING", "HIDDEN_LEARNING_DETECTED"],
  ["BEHAVIORAL_MUTATION", "UNAUTHORIZED_BEHAVIORAL_MUTATION"],
  ["REPLAY_CORRUPTION", "REPLAY_CORRUPTION_DETECTED"],
  ["EVIDENCE_POISONING", "EVIDENCE_POISONING_DETECTED"],
  ["GOVERNANCE_DRIFT", "GOVERNANCE_DRIFT_UNCONTAINED"],
  ["CONSTITUTIONAL_DRIFT", "CONSTITUTIONAL_DRIFT_DETECTED"],
  ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
  ["CONFIDENCE_DRIFT", "CONFIDENCE_DRIFT_THRESHOLD_EXCEEDED"],
  ["RISK_DRIFT", "RISK_DRIFT_THRESHOLD_EXCEEDED"],
  ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_FAILED"],
  ["MEMORY_CONTAMINATION", "ADAPTIVE_MEMORY_CONTAMINATION"],
  ["CROSS_TENANT_EVIDENCE", "CROSS_TENANT_EVIDENCE_CONTAMINATION"],
  ["FAIL_OPEN_RECOVERY", "FAIL_OPEN_RECOVERY_DETECTED"],
  ["INCOMPLETE_CONTAINMENT", "CONTAINMENT_INCOMPLETE"],
  ["MISSING_OPERATOR_ESCALATION", "OPERATOR_ESCALATION_MISSING"],
  ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_LEDGER_VIOLATION"],
  ["INTEGRITY_FAILURE", "INTEGRITY_HASH_MISMATCH"],
];

describe("adaptive safety certification", () => {
  it("publishes the adaptive safety doctrine", () => {
    const contract = getAdaptiveSafetyContract();

    expect(contract.doctrine.version).toBe("adaptive-safety-certification/v10.15.6");
    expect(contract.doctrine.hidden_learning_prohibited).toBe(true);
    expect(contract.doctrine.behavioral_mutation_prohibited).toBe(true);
    expect(contract.doctrine.evidence_poisoning_prohibited).toBe(true);
    expect(contract.doctrine.fail_closed_required).toBe(true);
    expect(contract.doctrine.continuous_safety_required).toBe(true);
    expect(contract.doctrine.permitted_learning_sources).toEqual(expect.arrayContaining(["TRUTH_LEDGER", "CERTIFIED_ADAPTIVE_MEMORY", "REPLAY_ANALYSIS"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies adaptive safety deterministically", () => {
    const first = certifyAdaptiveSafety();
    const second = certifyAdaptiveSafety();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.safe).toBe(true);
    expect(first.replayable).toBe(true);
    expect(first.tenant_isolated).toBe(true);
    expect(first.fail_closed).toBe(true);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateAdaptiveSafetyCertification(first).valid).toBe(true);
    expect(replayAdaptiveSafetyCertification(first)).toBe(true);
  });

  it("validates every safety detector and containment domain", () => {
    const result = certifyAdaptiveSafety();

    expect(result.hidden_learning_detection.hidden_learning_absent).toBe(true);
    expect(result.behavioral_mutation_detection.unauthorized_mutation_blocked).toBe(true);
    expect(result.replay_safety_validation.replay_integrity_preserved).toBe(true);
    expect(result.evidence_safety_validation.evidence_lineage_integrity_verified).toBe(true);
    expect(result.adaptive_drift_validation.governance_supremacy_maintained).toBe(true);
    expect(result.adaptive_drift_validation.authority_escalation_blocked).toBe(true);
    expect(result.adaptive_drift_validation.confidence_calibration_stable).toBe(true);
    expect(result.adaptive_drift_validation.risk_calibration_stable).toBe(true);
    expect(result.containment_recovery_validation.containment_deterministic).toBe(true);
    expect(result.containment_recovery_validation.operator_escalation_functional).toBe(true);
    expect(result.containment_recovery_validation.safety_ledger_append_only).toBe(true);
  });

  it("emits complete safety and risk reports", () => {
    const result = certifyAdaptiveSafety();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.hidden_learning_assessment).toBe("PASS");
    expect(result.risk_assessment_report.safety_risk_profile).toBe("LOW");
    expect(result.risk_assessment_report.threat_coverage_complete).toBe(true);
    expect(result.risk_assessment_report.replay_trustworthy).toBe(true);
    expect(result.risk_assessment_report.certification_evidence_refs.length).toBeGreaterThan(0);
    expect(result.validation_tests).toHaveLength(24);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyAdaptiveSafety({ scenario });
    const validation = validateAdaptiveSafetyCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayAdaptiveSafetyCertification(result)).toBe(false);
  });

  it("detects tampering through integrity checks", () => {
    const result = certifyAdaptiveSafety();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        hidden_learning_status: "FAIL" as const,
      },
    };

    expect(validateAdaptiveSafetyCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayAdaptiveSafetyCertification(tampered)).toBe(false);
  });
});
