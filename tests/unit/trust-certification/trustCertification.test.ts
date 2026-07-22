import { describe, expect, it } from "vitest";
import { getTrustCertificationBundle, replayTrustCertification, runTrustCertification, validateTrustCertification } from "@/services/trust-certification";
import type { TrustCertificationFailure } from "@/types/trust-certification";

const FAILURE_MATRIX: readonly TrustCertificationFailure[] = [
  "P5_15_RECOVERY_INVALID",
  "CERTIFICATION_ARCHITECTURE_MISSING",
  "CERTIFICATION_LIFECYCLE_MISSING",
  "CERTIFICATION_TERMINOLOGY_MISSING",
  "CERTIFICATION_CONTRACTS_MISSING",
  "CERTIFICATION_POLICIES_MISSING",
  "CERTIFICATION_SCOPE_REGISTRY_MISSING",
  "CERTIFICATION_EVIDENCE_REGISTRY_MISSING",
  "CERTIFICATION_EVALUATION_ENGINE_MISSING",
  "TRUST_ATTESTATION_MISSING",
  "CERTIFICATE_GENERATION_MISSING",
  "CERTIFICATION_GOVERNANCE_MISSING",
  "CERTIFICATION_REPLAY_AUDIT_MISSING",
  "CERTIFICATION_OBSERVABILITY_MISSING",
  "CERTIFICATION_REGISTRY_MISSING",
  "CERTIFICATION_DECISION_ENGINE_MISSING",
  "CERTIFICATION_EVIDENCE_MISSING",
  "CERTIFICATION_EVIDENCE_STALE",
  "CERTIFICATION_EVIDENCE_CONFLICTING",
  "CERTIFICATION_EVIDENCE_UNVERIFIABLE",
  "CONSTITUTIONAL_COMPLIANCE_INVALID",
  "GOVERNANCE_COMPLIANCE_INVALID",
  "SAFETY_QUALIFICATION_INVALID",
  "ALIGNMENT_VERIFICATION_INVALID",
  "REPLAY_RECONSTRUCTION_FAILED",
  "OPERATIONAL_READINESS_INVALID",
  "TRUST_INTEGRITY_INVALID",
  "ATTESTATION_NOT_REPRODUCIBLE",
  "CERTIFICATE_NOT_IMMUTABLE",
  "GOVERNANCE_APPROVAL_MISSING",
  "CERTIFICATION_REPORT_MISSING",
  "OBSERVABILITY_DASHBOARD_MISSING",
  "REGISTRY_NOT_OPERATIONAL",
  "PROGRAM_QUALIFICATION_EXECUTED",
  "TRUST_EVALUATION_EXECUTED",
  "ALIGNMENT_VERIFICATION_EXECUTED",
  "COMPLIANCE_EVALUATION_EXECUTED",
  "SAFETY_QUALIFICATION_EXECUTED",
  "OPERATIONAL_MONITORING_EXECUTED",
  "TRUST_RECOVERY_EXECUTED",
];

describe("P5.16 Trust Certification", () => {
  it("publishes trust certification doctrine without becoming program qualification", () => {
    const bundle = getTrustCertificationBundle();

    expect(bundle.doctrine.version).toBe("trust-certification/v5.16");
    expect(bundle.doctrine.owns_trust_certification).toBe(true);
    expect(bundle.doctrine.owns_certification_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_trust_attestation).toBe(true);
    expect(bundle.doctrine.owns_certification_evidence).toBe(true);
    expect(bundle.doctrine.performs_program_qualification).toBe(false);
    expect(bundle.doctrine.evaluates_trust).toBe(false);
    expect(bundle.doctrine.verifies_alignment).toBe(false);
    expect(bundle.doctrine.evaluates_compliance).toBe(false);
    expect(bundle.doctrine.qualifies_safety).toBe(false);
    expect(bundle.doctrine.monitors_operations).toBe(false);
    expect(bundle.doctrine.recovers_trust).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic certificates, attestations, evidence, reports, and registry entries", () => {
    const first = runTrustCertification();
    const second = runTrustCertification();

    expect(first.phase_identifier).toBe("TrustCertification");
    expect(first.recovery_ref).toBe("trust-recovery-revocation/v5.15");
    expect(first.scope.certifiable_assets).toHaveLength(9);
    expect(first.evidence).toHaveLength(11);
    expect(first.evidence.every((item) => item.validation_status === "VALID")).toBe(true);
    expect(first.evaluation.deterministic_replay).toBe(true);
    expect(first.attestation.reproducible).toBe(true);
    expect(first.certificate.certification_status).toBe("CERTIFIED");
    expect(first.certificate.certification_decision).toBe("CERTIFIED_WITH_RESTRICTIONS");
    expect(first.lifecycle.current_status).toBe("CERTIFIED");
    expect(first.registry.operational).toBe(true);
    expect(first.boundary.program_qualification_executed).toBe(false);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustCertification(first).valid).toBe(true);
    expect(replayTrustCertification(first)).toBe(true);
  });

  it("passes only when all certification exit criteria are satisfied", () => {
    const result = runTrustCertification();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.architecture_complete).toBe(true);
    expect(result.certification.lifecycle_implemented).toBe(true);
    expect(result.certification.certificates_deterministic).toBe(true);
    expect(result.certification.evidence_immutable_traceable).toBe(true);
    expect(result.certification.attestations_reproducible).toBe(true);
    expect(result.certification.replay_reconstructs_decisions).toBe(true);
    expect(result.certification.governance_approval_enforced).toBe(true);
    expect(result.certification.safety_qualification_validated).toBe(true);
    expect(result.certification.constitutional_compliance_verified).toBe(true);
    expect(result.certification.registry_operational).toBe(true);
    expect(result.certification.observability_complete).toBe(true);
    expect(result.certification.reports_generated).toBe(true);
    expect(result.certification.not_program_qualification).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails certification for %s", (failure) => {
    const result = runTrustCertification({ scenario: failure });
    const validation = validateTrustCertification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without certification readiness", () => {
    const result = runTrustCertification({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustCertification(result).valid).toBe(false);
  });

  it.each(["CERTIFICATION_EVIDENCE_MISSING", "CERTIFICATION_EVIDENCE_STALE", "CERTIFICATION_EVIDENCE_CONFLICTING", "CERTIFICATION_EVIDENCE_UNVERIFIABLE"] as const)("does not certify invalid evidence: %s", (scenario) => {
    const result = runTrustCertification({ scenario });

    expect(result.evaluation.evidence_completeness).toBe(false);
    expect(result.certificate.certification_decision).toBe("REQUIRES_MORE_EVIDENCE");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.evidence_immutable_traceable).toBe(false);
  });

  it("detects accidental Program Qualification execution", () => {
    const result = runTrustCertification({ scenario: "PROGRAM_QUALIFICATION_EXECUTED" });

    expect(result.boundary.program_qualification_executed).toBe(true);
    expect(result.certification.not_program_qualification).toBe(false);
    expect(result.certification.failures).toContain("PROGRAM_QUALIFICATION_EXECUTED");
  });
});
