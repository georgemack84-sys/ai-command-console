import { describe, expect, it } from "vitest";
import { getProvingProgramQualificationBundle, replayProvingProgramQualification, runProvingProgramQualification, validateProvingProgramQualification } from "@/services/proving-program-qualification";
import type { ProgramQualificationFailure } from "@/types/proving-program-qualification";

const CONDITIONAL_FAILURES: readonly ProgramQualificationFailure[] = [
  "CONSTITUTIONAL_QUALIFICATION_FAILED",
  "ARCHITECTURE_QUALIFICATION_FAILED",
  "DETERMINISTIC_PROVING_FAILED",
  "DETERMINISTIC_REPLAY_FAILED",
  "SIMULATION_CORRECTNESS_FAILED",
  "SYNTHETIC_ENVIRONMENT_FIDELITY_FAILED",
  "DIGITAL_TWIN_ACCURACY_FAILED",
  "VALIDATION_CAPABILITY_FAILED",
  "ADVERSARIAL_TESTING_CAPABILITY_FAILED",
  "RESILIENCE_VALIDATION_FAILED",
  "INTEROPERABILITY_VALIDATION_FAILED",
  "BENCHMARK_COMPLETENESS_FAILED",
  "OPERATIONAL_EXERCISE_CAPABILITY_FAILED",
  "CONTINUOUS_PROVING_FAILED",
  "REGRESSION_VALIDATION_FAILED",
  "GOVERNANCE_COMPLIANCE_FAILED",
  "AUTHORITY_COMPLIANCE_FAILED",
  "POLICY_ENFORCEMENT_FAILED",
  "SAFETY_QUALIFICATION_FAILED",
  "TRUST_QUALIFICATION_FAILED",
  "EXPLAINABILITY_QUALIFICATION_FAILED",
  "HUMAN_OVERSIGHT_FAILED",
  "READINESS_QUALIFICATION_FAILED",
  "OPERATIONAL_READINESS_FAILED",
  "CONSUMER_READINESS_FAILED",
  "ECOSYSTEM_READINESS_FAILED",
  "FEDERATION_QUALIFICATION_FAILED",
  "CERTIFICATION_REHEARSAL_FAILED",
  "ECOSYSTEM_QUALIFICATION_FAILED",
  "CROSS_PROGRAM_VERIFICATION_FAILED",
];

describe("P6.18 Program Qualification", () => {
  it("publishes program qualification doctrine without creating proving capabilities", () => {
    const bundle = getProvingProgramQualificationBundle();

    expect(bundle.doctrine.version).toBe("proving-program-qualification/v6.18");
    expect(bundle.doctrine.owns_program_qualification).toBe(true);
    expect(bundle.doctrine.owns_proving_qualification).toBe(true);
    expect(bundle.doctrine.owns_proving_authority_verification).toBe(true);
    expect(bundle.doctrine.owns_qualification_governance).toBe(true);
    expect(bundle.doctrine.owns_qualification_decision).toBe(true);
    expect(bundle.doctrine.creates_no_new_proving_capabilities).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic qualification with the P6.17 federation dependency", () => {
    const first = runProvingProgramQualification();
    const second = runProvingProgramQualification();

    expect(first.phase_identifier).toBe("ProvingProgramQualification");
    expect(first.federation_ref).toBe("proving-ecosystem-validation-federation/v6.17");
    expect(first.domain_reports).toHaveLength(15);
    expect(first.evidence_ledger.categories).toHaveLength(9);
    expect(first.traceability_matrix.p6_phases).toHaveLength(17);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingProgramQualification(first).valid).toBe(true);
    expect(replayProvingProgramQualification(first)).toBe(true);
  });

  it("verifies every qualification domain and cross-program requirement", () => {
    const result = runProvingProgramQualification();

    expect(result.domain_reports.every((report) => report.verified)).toBe(true);
    expect(result.program_report.domains_verified).toBe(15);
    expect(result.program_report.constitutional_requirements_verified).toBe(true);
    expect(result.cross_program_matrix.program_1).toBe(true);
    expect(result.cross_program_matrix.program_5).toBe(true);
    expect(result.cross_program_matrix.trust_verified).toBe(true);
    expect(result.cross_program_matrix.safety_verified).toBe(true);
  });

  it("produces immutable evidence, traceability, approval, and final qualification decision", () => {
    const result = runProvingProgramQualification();

    expect(result.evidence_ledger.immutable).toBe(true);
    expect(result.evidence_ledger.lineage_immutable).toBe(true);
    expect(result.evidence_ledger.reproducible).toBe(true);
    expect(result.traceability_matrix.evidence_lineage_complete).toBe(true);
    expect(result.traceability_matrix.independent_qualification).toBe(true);
    expect(result.approval_record.governance_approved).toBe(true);
    expect(result.approval_record.authority_granted).toBe(true);
    expect(result.decision_record.decision).toBe("QUALIFIED");
    expect(result.decision_record.proving_authority_granted).toBe(true);
  });

  it("passes all P6.18 qualification gates and readiness checks", () => {
    const result = runProvingProgramQualification();

    expect(result.gates.precondition_gate).toBe(true);
    expect(result.gates.constitutional_gate).toBe(true);
    expect(result.gates.architecture_gate).toBe(true);
    expect(result.gates.deterministic_gate).toBe(true);
    expect(result.gates.validation_gate).toBe(true);
    expect(result.gates.continuous_gate).toBe(true);
    expect(result.gates.governance_gate).toBe(true);
    expect(result.gates.safety_trust_gate).toBe(true);
    expect(result.gates.explainability_oversight_gate).toBe(true);
    expect(result.gates.evidence_gate).toBe(true);
    expect(result.gates.readiness_gate).toBe(true);
    expect(result.gates.federation_gate).toBe(true);
    expect(result.gates.certification_rehearsal_gate).toBe(true);
    expect(result.gates.ecosystem_gate).toBe(true);
    expect(result.gates.approval_gate).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.readiness.decision).toBe("QUALIFIED");
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks program conditionally qualified for non-critical deficiency %s", (failure) => {
    const result = runProvingProgramQualification({ scenario: failure });
    const validation = validateProvingProgramQualification(result);

    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.decision_record.restrictions).toContain("deployment permitted only under approved governance restrictions");
    expect(validation.valid).toBe(false);
  });

  it.each(["P6_17_FEDERATION_INVALID", "PREVIOUS_PHASE_INCOMPLETE", "REQUIRED_ARTIFACT_MISSING", "EVIDENCE_INCOMPLETE", "EVIDENCE_NOT_IMMUTABLE", "LINEAGE_NOT_IMMUTABLE", "TRACEABILITY_INCOMPLETE", "REPRODUCIBILITY_FAILED", "GOVERNANCE_APPROVAL_MISSING", "INDEPENDENT_QUALIFICATION_VIOLATED", "FINAL_APPROVAL_RECORD_MISSING"] as const)("marks program not qualified for critical blocker %s", (failure) => {
    const result = runProvingProgramQualification({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.decision_record.proving_authority_granted).toBe(false);
    expect(result.decision_record.production_use_authorized).toBe(false);
    expect(validateProvingProgramQualification(result).valid).toBe(false);
  });

  it("supports explicit conditional qualification scenario", () => {
    const result = runProvingProgramQualification({ scenario: "CONDITIONALLY_QUALIFIED" });

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.decision_record.restrictions).toHaveLength(1);
    expect(validateProvingProgramQualification(result).valid).toBe(false);
  });
});
