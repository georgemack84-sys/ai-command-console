import { describe, expect, it } from "vitest";
import { getTrustEcosystemFederationBundle, replayTrustEcosystemFederation, runTrustEcosystemFederation, validateTrustEcosystemFederation } from "@/services/trust-ecosystem-federation";
import type { TrustFederationFailure } from "@/types/trust-ecosystem-federation";

const FAILURE_MATRIX: readonly TrustFederationFailure[] = [
  "P5_16_CERTIFICATION_INVALID",
  "FEDERATION_ARCHITECTURE_MISSING",
  "FEDERATION_IDENTITY_MODEL_MISSING",
  "FEDERATION_TRUST_REGISTRY_MISSING",
  "CROSS_PROGRAM_MATRIX_MISSING",
  "FEDERATION_TRUST_EVALUATION_MISSING",
  "TRUST_INTEROPERABILITY_MISSING",
  "FEDERATION_GOVERNANCE_MISSING",
  "P5_P4_LINEAGE_COMPATIBILITY_FAILED",
  "CERTIFICATION_TRIGGERED_INVALIDATION_MISSING",
  "FEDERATION_LIFECYCLE_MISSING",
  "FEDERATION_OBSERVABILITY_MISSING",
  "FEDERATION_AUDIT_LINEAGE_MISSING",
  "TENANT_ISOLATION_FAILURE",
  "FEDERATION_CERTIFICATION_GATE_MISSING",
  "PROGRAM_3_QUALIFICATION_BYPASSED",
  "PROGRAM_4_CERTIFICATION_BYPASSED",
  "UNAUTHORIZED_AUTHORITY_GRANTED",
  "PRIVILEGE_ELEVATED",
  "EXECUTION_AUTHORIZED_BY_FEDERATION",
  "IMPLICIT_TRUST_PROPAGATED",
  "FEDERATION_EVIDENCE_MISSING",
  "FEDERATION_EVIDENCE_STALE",
  "FEDERATION_EVIDENCE_CONFLICTING",
  "FEDERATION_EVIDENCE_UNVERIFIABLE",
  "FEDERATION_REPLAY_FAILED",
  "FEDERATION_LINEAGE_INCOMPLETE",
  "FEDERATION_REGISTRY_NOT_OPERATIONAL",
  "INTEROPERABILITY_NOT_VERIFIED",
  "GOVERNANCE_NOT_ENFORCED",
  "CONSTITUTIONAL_COMPLIANCE_INVALID",
  "CERTIFICATION_LINEAGE_INCOMPATIBLE",
  "INVALIDATION_BEFORE_LINEAGE_VERIFICATION",
  "OBSERVABILITY_NOT_OPERATIONAL",
  "FAIL_CLOSED_NOT_VERIFIED",
];

describe("P5.17 Trust Ecosystem Federation", () => {
  it("publishes advisory federation doctrine that expands visibility, not authority", () => {
    const bundle = getTrustEcosystemFederationBundle();
    expect(bundle.doctrine.version).toBe("trust-ecosystem-federation/v5.17");
    expect(bundle.doctrine.owns_cross_program_trust_federation).toBe(true);
    expect(bundle.doctrine.owns_federation_governance).toBe(true);
    expect(bundle.doctrine.owns_trust_interoperability).toBe(true);
    expect(bundle.doctrine.owns_federation_trust_evaluation).toBe(true);
    expect(bundle.doctrine.grants_authority).toBe(false);
    expect(bundle.doctrine.elevates_privilege).toBe(false);
    expect(bundle.doctrine.authorizes_execution).toBe(false);
    expect(bundle.doctrine.bypasses_constitutional_governance).toBe(false);
    expect(bundle.doctrine.replaces_originating_trust_evaluations).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic federation records, matrix, lineage validation, and readiness", () => {
    const first = runTrustEcosystemFederation();
    const second = runTrustEcosystemFederation();
    expect(first.phase_identifier).toBe("TrustEcosystemFederation");
    expect(first.certification_ref).toBe("trust-certification/v5.16");
    expect(first.record.trust_level).toBe("ADVISORY");
    expect(first.evaluation.trust_decision).toBe("CONDITIONALLY_TRUSTED");
    expect(first.lineage.validation_id).toBe("P5-P4-VERIFY-001");
    expect(first.lineage.compatible).toBe(true);
    expect(first.invalidation.lineage_verified_before_invalidation).toBe(true);
    expect(first.security.tenant_isolation).toBe(true);
    expect(first.audit.evidence_lineage.length).toBeGreaterThan(0);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustEcosystemFederation(first).valid).toBe(true);
    expect(replayTrustEcosystemFederation(first)).toBe(true);
  });

  it("passes only when federation certification criteria are satisfied", () => {
    const result = runTrustEcosystemFederation();
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.architecture_complete).toBe(true);
    expect(result.certification.registry_operational).toBe(true);
    expect(result.certification.interoperability_verified).toBe(true);
    expect(result.certification.trust_evaluation_deterministic).toBe(true);
    expect(result.certification.governance_enforced).toBe(true);
    expect(result.certification.constitutional_compliance_verified).toBe(true);
    expect(result.certification.p5_p4_verify_001_satisfied).toBe(true);
    expect(result.certification.tenant_isolation_maintained).toBe(true);
    expect(result.certification.replay_reproducible).toBe(true);
    expect(result.certification.audit_lineage_complete).toBe(true);
    expect(result.certification.observability_operational).toBe(true);
    expect(result.certification.fail_closed_verified).toBe(true);
    expect(result.certification.advisory_only).toBe(true);
  });

  it.each(FAILURE_MATRIX)("fails federation certification for %s", (failure) => {
    const result = runTrustEcosystemFederation({ scenario: failure });
    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validateTrustEcosystemFederation(result).valid).toBe(false);
  });

  it("routes governance-review scenarios without federation readiness", () => {
    const result = runTrustEcosystemFederation({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });
    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });

  it.each(["FEDERATION_EVIDENCE_MISSING", "FEDERATION_EVIDENCE_STALE", "FEDERATION_EVIDENCE_CONFLICTING", "FEDERATION_EVIDENCE_UNVERIFIABLE"] as const)("fails closed for invalid federation evidence: %s", (scenario) => {
    const result = runTrustEcosystemFederation({ scenario });
    expect(result.evaluation.trust_decision).toBe("FAIL_CLOSED");
    expect(result.lifecycle.activation_allowed).toBe(false);
    expect(result.certification.fail_closed_verified).toBe(true);
  });

  it("blocks invalidation until P5-P4 lineage verification succeeds", () => {
    const result = runTrustEcosystemFederation({ scenario: "P5_P4_LINEAGE_COMPATIBILITY_FAILED" });
    expect(result.lineage.compatible).toBe(false);
    expect(result.evaluation.trust_decision).toBe("FAIL_CLOSED");
    expect(result.certification.p5_p4_verify_001_satisfied).toBe(false);
  });
});
