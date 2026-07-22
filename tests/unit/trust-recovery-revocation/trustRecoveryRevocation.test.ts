import { describe, expect, it } from "vitest";
import { getTrustRecoveryRevocationBundle, replayTrustRecoveryRevocation, runTrustRecoveryRevocation, validateTrustRecoveryRevocation } from "@/services/trust-recovery-revocation";
import type { TrustRecoveryFailure } from "@/types/trust-recovery-revocation";

const FAILURE_MATRIX: readonly TrustRecoveryFailure[] = [
  "P5_14_DRIFT_DETECTION_INVALID",
  "RECOVERY_FRAMEWORK_MISSING",
  "SUSPENSION_MANAGEMENT_MISSING",
  "REVOCATION_MANAGEMENT_MISSING",
  "RECOVERY_PLANNING_MISSING",
  "RESTORATION_EVIDENCE_COLLECTION_MISSING",
  "REQUALIFICATION_INITIATION_MISSING",
  "RESTORATION_DECISION_ENGINE_MISSING",
  "GOVERNANCE_APPROVAL_MISSING",
  "RECOVERY_OBSERVABILITY_MISSING",
  "AUDIT_LINEAGE_MISSING",
  "TRUST_SELF_RESTORED",
  "HISTORIC_EVIDENCE_ONLY",
  "NEW_EVIDENCE_MISSING",
  "GOVERNANCE_APPROVAL_ABSENT",
  "SAFETY_APPROVAL_ABSENT",
  "CONSTITUTIONAL_VIOLATION_UNRESOLVED",
  "DRIFT_UNRESOLVED",
  "REMEDIATION_INCOMPLETE",
  "RECOVERY_EVIDENCE_MISSING",
  "RECOVERY_EVIDENCE_STALE",
  "RECOVERY_EVIDENCE_CONFLICTING",
  "RECOVERY_EVIDENCE_UNVERIFIABLE",
  "RECOVERY_REPLAY_FAILED",
  "UNKNOWN_PERSISTED",
  "UNKNOWN_NOT_FAIL_CLOSED",
  "SUSPENSION_RECORD_MISSING",
  "REVOCATION_RECORD_MISSING",
  "RECOVERY_PLAN_MISSING",
  "REQUALIFICATION_REQUEST_MISSING",
  "RESTORATION_DECISION_MISSING",
  "RECOVERY_DASHBOARD_MISSING",
  "IMMUTABLE_AUDIT_MISSING",
  "TRACEABILITY_INCOMPLETE",
];

describe("P5.15 Trust Recovery & Revocation", () => {
  it("publishes recovery doctrine with no self-restoration and no persisted UNKNOWN", () => {
    const bundle = getTrustRecoveryRevocationBundle();

    expect(bundle.doctrine.version).toBe("trust-recovery-revocation/v5.15");
    expect(bundle.doctrine.owns_trust_suspension).toBe(true);
    expect(bundle.doctrine.owns_trust_revocation).toBe(true);
    expect(bundle.doctrine.owns_trust_restoration).toBe(true);
    expect(bundle.doctrine.owns_trust_recovery).toBe(true);
    expect(bundle.doctrine.owns_requalification_initiation).toBe(true);
    expect(bundle.doctrine.self_restores_trust).toBe(false);
    expect(bundle.doctrine.persists_unknown).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("produces deterministic suspension, revocation, recovery, requalification, and audit artifacts", () => {
    const first = runTrustRecoveryRevocation();
    const second = runTrustRecoveryRevocation();

    expect(first.phase_identifier).toBe("TrustRecoveryRevocation");
    expect(first.drift_detection_ref).toBe("trust-drift-detection/v5.14");
    expect(first.suspension.standing).toBe("SUSPENDED");
    expect(first.revocation.standing).toBe("REVOKED");
    expect(first.plan.deterministic).toBe(true);
    expect(first.evidence.new_evidence_refs.length).toBeGreaterThan(0);
    expect(first.requalification.package_complete).toBe(true);
    expect(first.approval.automatic_restoration).toBe(false);
    expect(first.decision.decision).toBe("RESTORE");
    expect(first.audit.immutable).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustRecoveryRevocation(first).valid).toBe(true);
    expect(replayTrustRecoveryRevocation(first)).toBe(true);
  });

  it("passes only when all recovery exit criteria are satisfied", () => {
    const result = runTrustRecoveryRevocation();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.suspension_lifecycle_implemented).toBe(true);
    expect(result.certification.revocation_lifecycle_auditable).toBe(true);
    expect(result.certification.expiration_handling_supported).toBe(true);
    expect(result.certification.unknown_runtime_only).toBe(true);
    expect(result.certification.recovery_plans_deterministic).toBe(true);
    expect(result.certification.restoration_evidence_traceable).toBe(true);
    expect(result.certification.governance_approval_mandatory).toBe(true);
    expect(result.certification.safety_validation_gates_restoration).toBe(true);
    expect(result.certification.requalification_initiated).toBe(true);
    expect(result.certification.replayable_with_audit_lineage).toBe(true);
    expect(result.certification.decisions_explainable_and_compliant).toBe(true);
    expect(result.certification.invalid_evidence_fail_closed).toBe(true);
    expect(result.certification.failures).toHaveLength(0);
  });

  it.each(FAILURE_MATRIX)("fails recovery certification for %s", (failure) => {
    const result = runTrustRecoveryRevocation({ scenario: failure });
    const validation = validateTrustRecoveryRevocation(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review scenarios without recovery readiness", () => {
    const result = runTrustRecoveryRevocation({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.certification.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
    expect(validateTrustRecoveryRevocation(result).valid).toBe(false);
  });

  it.each(["RECOVERY_EVIDENCE_MISSING", "RECOVERY_EVIDENCE_STALE", "RECOVERY_EVIDENCE_CONFLICTING", "RECOVERY_EVIDENCE_UNVERIFIABLE"] as const)("fails closed for invalid recovery evidence: %s", (scenario) => {
    const result = runTrustRecoveryRevocation({ scenario });

    expect(result.evidence.verifiable).toBe(false);
    expect(result.decision.decision).toBe("FAIL_CLOSED");
    expect(result.certification.invalid_evidence_fail_closed).toBe(true);
    expect(result.certification.phase_ready).toBe(false);
  });

  it("prevents self-restoration and persisted UNKNOWN sentinel behavior", () => {
    const selfRestored = runTrustRecoveryRevocation({ scenario: "TRUST_SELF_RESTORED" });
    const unknown = runTrustRecoveryRevocation({ scenario: "UNKNOWN_PERSISTED" });

    expect(selfRestored.approval.automatic_restoration).toBe(true);
    expect(selfRestored.certification.governance_approval_mandatory).toBe(false);
    expect(unknown.certification.unknown_runtime_only).toBe(false);
    expect(unknown.certification.failures).toContain("UNKNOWN_PERSISTED");
  });
});
