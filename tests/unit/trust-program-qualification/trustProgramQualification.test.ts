import { describe, expect, it } from "vitest";
import { getTrustProgramQualificationBundle, replayTrustProgramQualification, runTrustProgramQualification, validateTrustProgramQualification } from "@/services/trust-program-qualification";
import type { TrustProgramQualificationFailure } from "@/types/trust-program-qualification";

const FAILURE_MATRIX: readonly TrustProgramQualificationFailure[] = [
  "P5_0_CONSTITUTIONAL_FOUNDATION_INVALID",
  "P5_1_ARCHITECTURE_FOUNDATION_INVALID",
  "P5_2_TRUST_DOMAIN_RESOLUTION_INVALID",
  "P5_5_EVIDENCE_CONFIDENCE_INVALID",
  "P5_6_RISK_GOVERNANCE_INVALID",
  "P5_7_TRUST_DECISION_DETERMINISM_INVALID",
  "P5_8_ALIGNMENT_VERIFICATION_INVALID",
  "P5_9_COMPLIANCE_VERIFICATION_INVALID",
  "P5_10_SAFETY_QUALIFICATION_INVALID",
  "P5_11_EXPLAINABILITY_INVALID",
  "P5_12_HUMAN_OVERSIGHT_INVALID",
  "P5_13_CONTINUOUS_MONITORING_INVALID",
  "P5_14_DRIFT_DETECTION_INVALID",
  "P5_15_RECOVERY_REVOCATION_INVALID",
  "P5_16_CERTIFICATION_INVALID",
  "P5_17_ECOSYSTEM_FEDERATION_INVALID",
  "CONSTITUTIONAL_VIOLATION",
  "TRUST_DECISION_NONDETERMINISM",
  "TRUST_DOMAIN_ISOLATION_FAILURE",
  "TENANT_BOUNDARY_VIOLATION",
  "EVIDENCE_INTEGRITY_FAILURE",
  "REPLAY_RECONSTRUCTION_FAILURE",
  "AUTHORITY_VIOLATION",
  "POLICY_VIOLATION",
  "SAFETY_QUALIFICATION_FAILURE",
  "TRUST_STANDING_INCONSISTENCY",
  "CONFIDENCE_COMPUTATION_INCONSISTENCY",
  "RISK_GOVERNANCE_FAILURE",
  "MISSING_CERTIFICATION_EVIDENCE",
  "FEDERATION_INTEROPERABILITY_FAILURE",
  "GOVERNANCE_BYPASS",
  "HUMAN_OVERSIGHT_BYPASS",
  "UNEXPLAINED_DRIFT",
  "UNRESOLVED_REVOCATION_STATE",
  "REGISTRY_INCONSISTENCY",
  "OPERATIONAL_READINESS_FAILURE",
  "CONSUMER_READINESS_FAILURE",
  "ECOSYSTEM_MATURITY_EVIDENCE_INCOMPLETE",
  "ARTIFACT_VALIDATION_FAILED",
  "REGISTRY_VALIDATION_FAILED",
  "CONTRACT_VALIDATION_FAILED",
  "LIFECYCLE_VALIDATION_FAILED",
  "CROSS_PROGRAM_INTEGRATION_FAILED",
  "QUALIFICATION_EVIDENCE_LEDGER_INCOMPLETE",
  "PROGRAM_QUALIFICATION_REPORT_MISSING",
  "QUALIFICATION_DECISION_MISSING",
];

describe("P5.18 Trust Program Qualification", () => {
  it("publishes doctrine that qualifies Program 5 itself without issuing runtime authority or bypassing governance", () => {
    const bundle = getTrustProgramQualificationBundle();

    expect(bundle.doctrine.version).toBe("trust-program-qualification/v5.18");
    expect(bundle.doctrine.owns_program_qualification).toBe(true);
    expect(bundle.doctrine.qualifies_program_itself).toBe(true);
    expect(bundle.doctrine.certifies_individual_trust_artifacts).toBe(false);
    expect(bundle.doctrine.issues_runtime_authority).toBe(false);
    expect(bundle.doctrine.bypasses_governance).toBe(false);
    expect(bundle.doctrine.bypasses_tenant_isolation).toBe(false);
    expect(bundle.doctrine.bypasses_originating_evaluations).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("qualifies CATA deterministically from P5.0-P5.17 evidence", () => {
    const first = runTrustProgramQualification();
    const second = runTrustProgramQualification();

    expect(first.phase_identifier).toBe("TrustProgramQualification");
    expect(first.certification_ref).toBe("trust-certification/v5.16");
    expect(first.federation_ref).toBe("trust-ecosystem-federation/v5.17");
    expect(first.decision.decision).toBe("QUALIFIED");
    expect(first.decision.outcome).toBe("PASS");
    expect(first.decision.constitutional_trust_authority).toBe(true);
    expect(first.decision.evidence_driven).toBe(true);
    expect(first.decision.deterministic).toBe(true);
    expect(first.decision.ecosystem_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustProgramQualification(first).valid).toBe(true);
    expect(replayTrustProgramQualification(first)).toBe(true);
  });

  it("covers every roadmap qualification scope and records immutable evidence", () => {
    const result = runTrustProgramQualification();

    expect(result.framework.lifecycle.at(0)).toBe("QUALIFICATION_REQUESTED");
    expect(result.framework.lifecycle.at(-1)).toBe("QUALIFICATION_DECISION_ISSUED");
    expect(result.framework.qualification_scope_count).toBe(22);
    expect(result.constitutional_compliance.result).toBe("PASS");
    expect(result.deterministic_decision_production.result).toBe("PASS");
    expect(result.evidence_integrity.result).toBe("PASS");
    expect(result.ecosystem_federation.evidence_refs).toContain("P5-P4-VERIFY-001");
    expect(result.deterministic_replay.evidence_refs.length).toBeGreaterThan(1);
    expect(result.evidence_completeness.evidence_refs.length).toBeGreaterThanOrEqual(16);
    expect(result.evidence_ledger.complete).toBe(true);
    expect(result.evidence_ledger.immutable).toBe(true);
    expect(result.evidence_ledger.replay_reconstructable).toBe(true);
    expect(result.evidence_ledger.cross_program_refs).toEqual([
      "program-1:constitution",
      "program-2:governance-evidence",
      "program-3:authority-policy-safety-trust",
      "program-4:application-certification-evidence",
    ]);
    expect(result.report.generated).toBe(true);
  });

  it("confirms operational, consumer, and ecosystem readiness", () => {
    const result = runTrustProgramQualification();

    expect(result.operational_readiness.result).toBe("PASS");
    expect(result.operational_readiness.deployment_ready).toBe(true);
    expect(result.operational_readiness.governance_ready).toBe(true);
    expect(result.operational_readiness.monitoring_ready).toBe(true);
    expect(result.operational_readiness.recovery_ready).toBe(true);
    expect(result.operational_readiness.interoperability_ready).toBe(true);
    expect(result.consumer_readiness.program_2_ready).toBe(true);
    expect(result.consumer_readiness.program_3_ready).toBe(true);
    expect(result.consumer_readiness.program_4_ready).toBe(true);
    expect(result.consumer_readiness.program_6_ready).toBe(true);
    expect(result.consumer_readiness.ecosystem_applications_ready).toBe(true);
    expect(result.ecosystem_maturity.maturity_score).toBeGreaterThanOrEqual(result.ecosystem_maturity.threshold);
  });

  it.each(FAILURE_MATRIX)("denies program qualification for %s", (failure) => {
    const result = runTrustProgramQualification({ scenario: failure });
    const validation = validateTrustProgramQualification(result);

    expect(result.decision.decision).toBe("NOT_QUALIFIED");
    expect(result.decision.outcome).toBe("FAIL");
    expect(result.decision.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("supports qualified-with-limitations only for explicitly accepted non-blocking constraints", () => {
    const result = runTrustProgramQualification({ scenario: "LIMITATIONS_ACCEPTED" });

    expect(result.decision.decision).toBe("QUALIFIED_WITH_LIMITATIONS");
    expect(result.decision.outcome).toBe("CONDITIONAL_PASS");
    expect(result.decision.accepted_limitations.length).toBeGreaterThan(0);
    expect(result.decision.failures).toEqual([]);
    expect(validateTrustProgramQualification(result).valid).toBe(true);
  });
});
