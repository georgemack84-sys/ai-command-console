import { describe, expect, it } from "vitest";
import { getProvingCertificationRehearsalQualificationPreparationBundle, replayProvingCertificationRehearsalQualificationPreparation, runProvingCertificationRehearsalQualificationPreparation, validateProvingCertificationRehearsalQualificationPreparation } from "@/services/proving-certification-rehearsal-qualification-preparation";
import type { RehearsalFailure } from "@/types/proving-certification-rehearsal-qualification-preparation";

const FAILURE_MATRIX: readonly RehearsalFailure[] = [
  "P6_11_OPERATIONAL_EXERCISE_INVALID",
  "CERTIFICATION_REHEARSAL_ENGINE_MISSING",
  "QUALIFICATION_REHEARSAL_ENGINE_MISSING",
  "EVIDENCE_REHEARSAL_MISSING",
  "EVIDENCE_INCOMPLETE",
  "EVIDENCE_INVALID",
  "EVIDENCE_LINEAGE_INCOMPLETE",
  "EVIDENCE_SIGNATURE_INVALID",
  "EVIDENCE_TIMESTAMP_INVALID",
  "EVIDENCE_NOT_REPLAYABLE",
  "EVIDENCE_NONDETERMINISTIC",
  "EVIDENCE_MUTATED",
  "GOVERNANCE_REHEARSAL_MISSING",
  "GOVERNANCE_FAILURE",
  "GOVERNANCE_DECISION_UNSUPPORTED",
  "PACKAGE_VALIDATION_MISSING",
  "QUALIFICATION_PACKAGE_INCOMPLETE",
  "CERTIFICATION_PACKAGE_INCOMPLETE",
  "DEPENDENCY_VALIDATION_FAILED",
  "PACKAGE_CONSISTENCY_FAILED",
  "ASSESSOR_READINESS_MISSING",
  "ASSESSOR_FAILURE",
  "OPERATIONAL_READINESS_MISSING",
  "OPERATIONAL_FAILURE",
  "REPORT_GENERATION_MISSING",
  "DOCUMENTATION_FAILURE",
  "UNRESOLVED_CRITICAL_FINDINGS",
  "UNRESOLVED_FAIL_CLOSED_CONDITION",
  "READINESS_DECLARED_AFTER_CONDITIONAL_PASS",
  "CERTIFICATION_DECISION_ATTEMPTED",
  "APPLICATION_CERTIFICATION_ATTEMPTED",
  "PLATFORM_CERTIFICATION_ATTEMPTED",
  "PROGRAM_QUALIFICATION_ATTEMPTED",
  "OPERATIONAL_CERTIFICATION_ATTEMPTED",
  "TRUST_CERTIFICATION_ATTEMPTED",
  "PRODUCTION_READINESS_ATTEMPTED",
];

describe("P6.12 Certification Rehearsal and Qualification Preparation", () => {
  it("publishes rehearsal doctrine without owning certification decisions, program qualification, certification, or production readiness", () => {
    const bundle = getProvingCertificationRehearsalQualificationPreparationBundle();

    expect(bundle.doctrine.version).toBe("proving-certification-rehearsal-qualification-preparation/v6.12");
    expect(bundle.doctrine.owns_certification_rehearsal).toBe(true);
    expect(bundle.doctrine.owns_qualification_rehearsal).toBe(true);
    expect(bundle.doctrine.owns_evidence_rehearsal).toBe(true);
    expect(bundle.doctrine.owns_governance_rehearsal).toBe(true);
    expect(bundle.doctrine.owns_certification_decisions).toBe(false);
    expect(bundle.doctrine.owns_application_certification).toBe(false);
    expect(bundle.doctrine.owns_platform_certification).toBe(false);
    expect(bundle.doctrine.owns_program_qualification).toBe(false);
    expect(bundle.doctrine.owns_operational_certification).toBe(false);
    expect(bundle.doctrine.owns_trust_certification).toBe(false);
    expect(bundle.doctrine.owns_production_readiness).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic certification and qualification rehearsals with P6.11 operational exercise dependency", () => {
    const first = runProvingCertificationRehearsalQualificationPreparation();
    const second = runProvingCertificationRehearsalQualificationPreparation();

    expect(first.phase_identifier).toBe("ProvingCertificationRehearsalQualificationPreparation");
    expect(first.operational_exercise_ref).toBe("proving-operational-exercise-framework/v6.11");
    expect(first.certification_rehearsal.outcome).toBe("PASS");
    expect(first.qualification_rehearsal.outcome).toBe("PASS");
    expect(first.evidence_report.deterministic).toBe(true);
    expect(first.evidence_report.replayable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingCertificationRehearsalQualificationPreparation(first).valid).toBe(true);
    expect(replayProvingCertificationRehearsalQualificationPreparation(first)).toBe(true);
  });

  it("validates evidence, governance, packages, assessors, operations, dashboard, and final report", () => {
    const result = runProvingCertificationRehearsalQualificationPreparation();

    expect(result.evidence_report.evidence_complete).toBe(true);
    expect(result.evidence_report.signatures_verified).toBe(true);
    expect(result.governance_report.constitutional_review).toBe(true);
    expect(result.governance_report.auditable_decisions).toBe(true);
    expect(result.package_report.qualification_package_complete).toBe(true);
    expect(result.package_report.certification_package_complete).toBe(true);
    expect(result.package_report.dependency_verified).toBe(true);
    expect(result.assessor_report.ready).toBe(true);
    expect(result.operational_report.ready).toBe(true);
    expect(result.dashboard.readiness_level).toBe("REHEARSAL_COMPLETE");
    expect(result.dashboard.qualification_readiness).toBe(true);
    expect(result.dashboard.certification_readiness).toBe(true);
    expect(result.final_report.final_report_generated).toBe(true);
    expect(result.final_report.unresolved_issues).toEqual([]);
  });

  it("passes all P6.12 gates, evidence, boundaries, and readiness checks", () => {
    const result = runProvingCertificationRehearsalQualificationPreparation();

    expect(result.gates.evidence_completeness).toBe(true);
    expect(result.gates.deterministic_replay).toBe(true);
    expect(result.gates.governance_readiness).toBe(true);
    expect(result.gates.cross_program_dependencies).toBe(true);
    expect(result.gates.readiness_authorization).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.deterministic).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.evidence.lineage_complete).toBe(true);
    expect(result.boundaries.owns_certification_decisions).toBe(false);
    expect(result.boundaries.owns_application_certification).toBe(false);
    expect(result.boundaries.owns_platform_certification).toBe(false);
    expect(result.boundaries.owns_program_qualification).toBe(false);
    expect(result.boundaries.owns_operational_certification).toBe(false);
    expect(result.boundaries.owns_trust_certification).toBe(false);
    expect(result.boundaries.owns_production_readiness).toBe(false);
    expect(result.readiness.level).toBe("REHEARSAL_COMPLETE");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails rehearsal readiness for %s", (failure) => {
    const result = runProvingCertificationRehearsalQualificationPreparation({ scenario: failure });
    const validation = validateProvingCertificationRehearsalQualificationPreparation(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("allows pass with findings as ready but not a certification decision", () => {
    const result = runProvingCertificationRehearsalQualificationPreparation({ scenario: "PASS_WITH_FINDINGS" });

    expect(result.readiness.outcome).toBe("PASS_WITH_FINDINGS");
    expect(result.readiness.level).toBe("READY");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.final_report.observations).toContain("finding:minor-documentation-improvement");
    expect(result.boundaries.owns_certification_decisions).toBe(false);
    expect(validateProvingCertificationRehearsalQualificationPreparation(result).valid).toBe(true);
  });

  it("does not declare readiness after a conditional pass", () => {
    const result = runProvingCertificationRehearsalQualificationPreparation({ scenario: "CONDITIONAL_REMEDIATION" });

    expect(result.readiness.outcome).toBe("CONDITIONAL_PASS");
    expect(result.readiness.level).toBe("CONDITIONALLY_READY");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.gates.readiness_authorization).toBe(false);
    expect(validateProvingCertificationRehearsalQualificationPreparation(result).valid).toBe(false);
  });
});
