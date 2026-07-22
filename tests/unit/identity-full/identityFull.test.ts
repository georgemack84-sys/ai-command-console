import { describe, expect, it } from "vitest";
import { getIdentityFullBundle, replayIdentityFull, runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import type { IdentityFullFailure } from "@/types/identity-full";

const CONDITIONAL_FAILURES: readonly IdentityFullFailure[] = [
  "SESSION_MANAGEMENT_MISSING",
  "SESSION_EXPIRATION_INVALID",
  "SESSION_RENEWAL_FAILED",
  "SESSION_REVOCATION_FAILED",
  "MULTI_DEVICE_SESSIONS_INVALID",
  "CREDENTIAL_LIFECYCLE_MISSING",
  "CREDENTIAL_ROTATION_FAILED",
  "CREDENTIAL_REVOCATION_FAILED",
  "KEY_ROLLOVER_FAILED",
  "PASSWORD_POLICY_MISSING",
  "MFA_ENROLLMENT_FAILED",
  "IDENTITY_RECOVERY_MISSING",
  "RECOVERY_GOVERNANCE_APPROVAL_MISSING",
  "IDENTITY_SUSPENSION_MISSING",
  "SUSPENSION_AUDIT_INCOMPLETE",
  "RESTORATION_FLOW_INVALID",
  "DELEGATED_AUTHORIZATION_MISSING",
  "DELEGATION_EXPIRATION_INVALID",
  "DELEGATION_REVOCATION_FAILED",
  "DELEGATION_CHAIN_INVALID",
  "FEDERATION_INTERFACES_MISSING",
  "EXTERNAL_IDENTITY_MAPPING_FAILED",
  "FEDERATION_POLICY_ENFORCEMENT_FAILED",
  "IDENTITY_EVIDENCE_INCOMPLETE",
  "IDENTITY_EVIDENCE_NOT_SEARCHABLE",
  "FUNCTIONAL_QUALIFICATION_FAILED",
  "SECURITY_QUALIFICATION_FAILED",
  "OPERATIONAL_QUALIFICATION_FAILED",
  "GOVERNANCE_QUALIFICATION_FAILED",
];

describe("W1.1B Identity Full", () => {
  it("publishes full identity doctrine and validates the baseline", () => {
    const bundle = getIdentityFullBundle();

    expect(bundle.doctrine.version).toBe("identity-full/w1.1b");
    expect(bundle.doctrine.owns_session_management).toBe(true);
    expect(bundle.doctrine.owns_credential_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_identity_recovery).toBe(true);
    expect(bundle.doctrine.owns_identity_suspension).toBe(true);
    expect(bundle.doctrine.owns_delegated_authorization).toBe(true);
    expect(bundle.doctrine.owns_federation_interfaces).toBe(true);
    expect(bundle.doctrine.owns_identity_evidence).toBe(true);
    expect(bundle.doctrine.owns_identity_qualification).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic full identity activation with W1.1A dependency", () => {
    const first = runIdentityFull();
    const second = runIdentityFull();

    expect(first.phase_identifier).toBe("IdentityFull");
    expect(first.identity_core_ref).toBe("identity-core/w1.1a");
    expect(first.sessions.session_registry).toHaveLength(3);
    expect(first.credentials.credential_types).toHaveLength(5);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateIdentityFull(first).valid).toBe(true);
    expect(replayIdentityFull(first)).toBe(true);
  });

  it("provides sessions, credentials, recovery, suspension, delegation, and federation", () => {
    const result = runIdentityFull();

    expect(result.sessions.deterministic_expiration).toBe(true);
    expect(result.sessions.tenant_isolation).toBe(true);
    expect(result.credentials.rotation).toBe(true);
    expect(result.credentials.mfa_enrollment).toBe(true);
    expect(result.recovery.governance_approval).toBe(true);
    expect(result.suspension.restoration).toBe(true);
    expect(result.delegation.scope_restrictions).toBe(true);
    expect(result.federation.protocols).toEqual(["SAML", "OAuth", "OpenID Connect", "External PKI"]);
  });

  it("produces immutable evidence and passes identity infrastructure qualification", () => {
    const result = runIdentityFull();

    expect(result.evidence.records).toHaveLength(8);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.signed).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.evidence.searchable).toBe(true);
    expect(result.qualification.functional).toBe(true);
    expect(result.qualification.security).toBe(true);
    expect(result.qualification.operational).toBe(true);
    expect(result.qualification.governance).toBe(true);
    expect(result.qualification.infrastructure_gate_passed).toBe(true);
  });

  it("achieves the Identity Infrastructure Gate", () => {
    const result = runIdentityFull();

    expect(result.readiness.decision).toBe("IDENTITY_INFRASTRUCTURE_READY");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.entry_criteria_ready).toBe(true);
    expect(result.readiness.sessions_ready).toBe(true);
    expect(result.readiness.credentials_ready).toBe(true);
    expect(result.readiness.recovery_ready).toBe(true);
    expect(result.readiness.suspension_ready).toBe(true);
    expect(result.readiness.delegation_ready).toBe(true);
    expect(result.readiness.federation_ready).toBe(true);
    expect(result.readiness.qualification_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks identity full conditionally ready for remediable deficiency %s", (failure) => {
    const result = runIdentityFull({ scenario: failure });
    const validation = validateIdentityFull(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["STORAGE_FULL_MISSING", "SECURITY_FULL_MISSING", "MESSAGING_CORE_MISSING", "REGISTRY_CORE_MISSING", "OBSERVABILITY_PLATFORM_MISSING", "IDENTITY_INFRASTRUCTURE_GATE_FAILED"] as const)("marks identity full not ready for entry/gate blocker %s", (failure) => {
    const result = runIdentityFull({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_READY");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateIdentityFull(result).valid).toBe(false);
  });

  it.each(["W1_1A_IDENTITY_CORE_INVALID", "SESSION_TENANT_ISOLATION_VIOLATED", "RECOVERY_AUTHORIZATION_FAILED", "RECOVERY_CRYPTOGRAPHIC_VERIFICATION_FAILED", "DELEGATION_SCOPE_VIOLATED", "FEDERATION_TRUST_RELATIONSHIP_INVALID", "IDENTITY_EVIDENCE_NOT_IMMUTABLE", "IDENTITY_EVIDENCE_NOT_SIGNED", "IDENTITY_EVIDENCE_NOT_REPLAYABLE"] as const)("fails closed for critical identity full defect %s", (failure) => {
    const result = runIdentityFull({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateIdentityFull(result).valid).toBe(false);
  });

  it("supports ready with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runIdentityFull({ scenario: "READY_WITH_OBSERVATIONS" });
    const conditional = runIdentityFull({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("READY_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateIdentityFull(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
