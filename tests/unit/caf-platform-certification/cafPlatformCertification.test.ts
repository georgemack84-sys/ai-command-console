import { describe, expect, it } from "vitest";
import {
  getPlatformCertificationBundle,
  replayPlatformCertification,
  runPlatformCertification,
  validatePlatformCertification,
} from "@/services/caf-platform-certification";
import type { PlatformCertificationScenario } from "@/types/caf-platform-certification";

describe("Program 3 P3.15 Platform Certification", () => {
  it("publishes certification doctrine with clean assurance and replay boundaries", () => {
    const bundle = getPlatformCertificationBundle();

    expect(bundle.doctrine.version).toBe("caf-platform-certification/v3.15");
    expect(bundle.doctrine.owns_certification_execution).toBe(true);
    expect(bundle.doctrine.consumes_platform_assurance).toBe(true);
    expect(bundle.doctrine.executes_replay).toBe(false);
    expect(bundle.doctrine.duplicates_platform_assurance).toBe(false);
    expect(bundle.doctrine.verifies_replay_independently).toBe(false);
    expect(bundle.doctrine.certifies_platform).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("issues deterministic platform certificate from P3.14 assurance outputs", () => {
    const first = runPlatformCertification();
    const second = runPlatformCertification();

    expect(first.platform_assurance_ref).toBe("caf-platform-assurance/v3.14");
    expect(first.eligibility.eligible).toBe(true);
    expect(first.evidence_package.complete).toBe(true);
    expect(first.decision.outcome).toBe("CERTIFIED");
    expect(first.certificate.certificate_id).toBe("P3.15-CAF-PLATFORM-CERTIFICATE-001");
    expect(first.certificate.integrity_verified).toBe(true);
    expect(first.ledger.immutable).toBe(true);
    expect(first.lifecycle.current_state).toBe("CERTIFIED");
    expect(first.certification_gate.gate_outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePlatformCertification(first).valid).toBe(true);
    expect(replayPlatformCertification(first)).toBe(true);
  });

  it("supports certificate retrieval, verification, lifecycle, governance, and audit lineage", () => {
    const result = runPlatformCertification();

    expect(result.governance.approvals_complete).toBe(true);
    expect(result.consumer_access.certificate_retrieval_available).toBe(true);
    expect(result.consumer_access.verification_service_available).toBe(true);
    expect(result.audit_lineage.certificate_traceable).toBe(true);
    expect(result.audit_lineage.evidence_traceable).toBe(true);
    expect(result.certification_gate.replay_evidence_complete_via_p3_14).toBe(true);
  });

  it.each([
    "P3_14_ASSURANCE_INVALID",
    "ASSURANCE_AGGREGATION_DUPLICATED",
    "REPLAY_EXECUTION_ATTEMPTED",
    "REPLAY_VERIFICATION_DUPLICATED",
    "ELIGIBILITY_NOT_VERIFIED",
    "CERTIFICATION_EVIDENCE_MISSING",
    "CERTIFICATION_EVIDENCE_MUTABLE",
    "CERTIFICATION_DECISION_NOT_GOVERNED",
    "GOVERNANCE_APPROVAL_ABSENT",
    "PLATFORM_CERTIFICATE_NOT_ISSUED",
    "CERTIFICATE_INTEGRITY_INVALID",
    "CERTIFICATION_LEDGER_FAILURE",
    "LIFECYCLE_NON_DETERMINISTIC",
    "AUDIT_LINEAGE_INCOMPLETE",
    "CERTIFICATION_API_UNAVAILABLE",
    "CONSTITUTIONAL_VIOLATION",
    "UNRESOLVED_ASSURANCE_FAILURE",
    "DEPENDENCY_VERIFICATION_FAILURE",
    "EVIDENCE_INTEGRITY_FAILURE",
    "UNRESOLVED_SAFETY_VIOLATION",
    "UNRESOLVED_AUTHORITY_VIOLATION",
    "UNRESOLVED_POLICY_VIOLATION",
    "CERTIFICATION_DECISION_NOT_TRACEABLE",
    "OUTCOME_FAMILY_RECONCILIATION_PENDING",
  ] as const)("fails certification for %s", (scenario: PlatformCertificationScenario) => {
    const result = runPlatformCertification({ scenario });
    const validation = validatePlatformCertification(result);

    expect(result.certification_gate.gate_outcome).toBe("FAIL");
    expect(result.certification_gate.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runPlatformCertification({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification_gate.gate_outcome).toBe("PRUNED");
    expect(result.certification_gate.failures).toContain("CERTIFICATION_PRUNED");
  });
});
