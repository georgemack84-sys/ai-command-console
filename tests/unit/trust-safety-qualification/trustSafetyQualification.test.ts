import { describe, expect, it } from "vitest";
import { getTrustSafetyQualificationBundle, replayTrustSafetyQualification, runTrustSafetyQualification, validateTrustSafetyQualification } from "@/services/trust-safety-qualification";
import type { TrustSafetyQualificationFailure } from "@/types/trust-safety-qualification";

const FAILURE_MATRIX: readonly TrustSafetyQualificationFailure[] = [
  "P5_9_COMPLIANCE_INVALID",
  "PROGRAM_3_SAFETY_EVIDENCE_MISSING",
  "SAFETY_QUALIFICATION_ARCHITECTURE_MISSING",
  "SAFETY_VOCABULARY_MISSING",
  "EVIDENCE_ASSESSMENT_INCOMPLETE",
  "SAFETY_EVIDENCE_INAUTHENTIC",
  "SAFETY_EVIDENCE_INCOMPLETE",
  "SAFETY_EVIDENCE_NONDETERMINISTIC",
  "SAFETY_EVIDENCE_NOT_REPRODUCIBLE",
  "SAFETY_EVIDENCE_NOT_REPLAYABLE",
  "SAFETY_EVIDENCE_MUTABLE",
  "TRUST_SAFETY_ASSESSMENT_INCOMPLETE",
  "AUTONOMY_SAFETY_ASSESSMENT_INCOMPLETE",
  "MISSION_SAFETY_ASSESSMENT_INCOMPLETE",
  "GOVERNANCE_SAFETY_ASSESSMENT_INCOMPLETE",
  "CONSTITUTIONAL_COMPLIANCE_INVALID",
  "AUTHORITY_COMPLIANCE_INVALID",
  "POLICY_COMPLIANCE_INVALID",
  "GOVERNANCE_COMPLIANCE_INVALID",
  "FAIL_CLOSED_INVALID",
  "QUALIFICATION_DECISION_NONDETERMINISTIC",
  "MISSING_EVIDENCE_QUALIFIED",
  "STALE_EVIDENCE_QUALIFIED",
  "CONFLICTING_EVIDENCE_QUALIFIED",
  "UNVERIFIABLE_EVIDENCE_QUALIFIED",
  "SAFETY_FINDINGS_MISSING",
  "QUALIFICATION_REPORT_MISSING",
  "LINEAGE_INCOMPLETE",
  "OBSERVABILITY_MISSING",
  "GOVERNANCE_INTEGRATION_MISSING",
  "RUNTIME_SAFETY_ENFORCEMENT_EXECUTED",
  "SAFETY_POLICY_EXECUTED",
  "SAFETY_EVIDENCE_GENERATED",
  "OPERATIONAL_MONITORING_OWNED",
  "CERTIFICATION_GATE_INCOMPLETE",
];

describe("P5.10 Trust Safety Qualification", () => {
  it("publishes the constitutional safety qualification doctrine", () => {
    const bundle = getTrustSafetyQualificationBundle();

    expect(bundle.doctrine.version).toBe("trust-safety-qualification/v5.10");
    expect(bundle.doctrine.owns_trust_safety).toBe(true);
    expect(bundle.doctrine.owns_autonomy_safety).toBe(true);
    expect(bundle.doctrine.owns_safety_qualification).toBe(true);
    expect(bundle.doctrine.executes_runtime_safety_enforcement).toBe(false);
    expect(bundle.doctrine.executes_safety_policy).toBe(false);
    expect(bundle.doctrine.generates_safety_evidence).toBe(false);
    expect(bundle.doctrine.owns_operational_safety_monitoring).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic safety qualification reports from Program 3 evidence", () => {
    const first = runTrustSafetyQualification();
    const second = runTrustSafetyQualification();

    expect(first.phase_identifier).toBe("TrustSafetyQualification");
    expect(first.trust_compliance_ref).toBe("trust-compliance-verification/v5.9");
    expect(first.evidence.evidence_status).toBe("COMPLETE");
    expect(first.evidence.evidence_refs).toHaveLength(7);
    expect(first.evidence.authentic).toBe(true);
    expect(first.evidence.complete).toBe(true);
    expect(first.evidence.deterministic).toBe(true);
    expect(first.evidence.reproducible).toBe(true);
    expect(first.evidence.replayable).toBe(true);
    expect(first.evidence.immutable).toBe(true);
    expect(first.evidence.traceable).toBe(true);
    expect(first.safety.trust_safety).toBe(true);
    expect(first.safety.autonomy_safety).toBe(true);
    expect(first.safety.mission_safety).toBe(true);
    expect(first.safety.governance_safety).toBe(true);
    expect(first.compliance.constitutional_validation).toBe(true);
    expect(first.compliance.authority_validation).toBe(true);
    expect(first.compliance.policy_validation).toBe(true);
    expect(first.compliance.governance_validation).toBe(true);
    expect(first.compliance.fail_closed_behavior).toBe(true);
    expect(first.qualification.qualification_result).toBe("QUALIFIED_WITH_RESTRICTIONS");
    expect(first.qualification.findings).toHaveLength(1);
    expect(first.report.lineage_reference).toBe("lineage:safety-qualification:p5.10");
    expect(first.gate.fail_closed_demonstrated).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustSafetyQualification(first).valid).toBe(true);
    expect(replayTrustSafetyQualification(first)).toBe(true);
  });

  it("passes only when every safety certification exit criterion is met", () => {
    const result = runTrustSafetyQualification();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.evidence_consumed).toBe(true);
    expect(result.certification.trust_safety_completed).toBe(true);
    expect(result.certification.autonomy_safety_completed).toBe(true);
    expect(result.certification.constitutional_compliance_verified).toBe(true);
    expect(result.certification.authority_compliance_verified).toBe(true);
    expect(result.certification.policy_compliance_verified).toBe(true);
    expect(result.certification.governance_compliance_verified).toBe(true);
    expect(result.certification.deterministic_qualification).toBe(true);
    expect(result.certification.lineage_preserved).toBe(true);
    expect(result.certification.reports_generated).toBe(true);
    expect(result.certification.findings_replayable).toBe(true);
    expect(result.certification.fail_closed_verified).toBe(true);
    expect(result.certification.boundary_respected).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails closed for %s", (failure) => {
    const result = runTrustSafetyQualification({ scenario: failure });
    const validation = validateTrustSafetyQualification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without qualifying readiness", () => {
    const result = runTrustSafetyQualification({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustSafetyQualification(result).valid).toBe(false);
  });

  it.each([
    "MISSING_EVIDENCE_QUALIFIED",
    "STALE_EVIDENCE_QUALIFIED",
    "CONFLICTING_EVIDENCE_QUALIFIED",
    "UNVERIFIABLE_EVIDENCE_QUALIFIED",
  ] as const)("detects unsafe qualification attempts for %s", (scenario) => {
    const result = runTrustSafetyQualification({ scenario });

    expect(result.qualification.qualification_result).toBe("QUALIFIED");
    expect(result.certification.fail_closed_verified).toBe(false);
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
  });

  it("keeps missing Program 3 safety evidence in fail-closed state", () => {
    const result = runTrustSafetyQualification({ scenario: "PROGRAM_3_SAFETY_EVIDENCE_MISSING" });

    expect(result.evidence.evidence_status).toBe("MISSING");
    expect(result.qualification.qualification_result).toBe("FAIL_CLOSED");
    expect(result.certification.evidence_consumed).toBe(false);
    expect(result.certification.phase_ready).toBe(false);
  });
});
