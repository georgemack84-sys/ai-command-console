import { describe, expect, it } from "vitest";
import { getSecurityFullBundle, replaySecurityFull, runSecurityFull, validateSecurityFull } from "@/services/security-full";
import type { SecurityFullFailure } from "@/types/security-full";

const CONDITIONAL_FAILURES: readonly SecurityFullFailure[] = [
  "PRODUCTION_KEY_LIFECYCLE_MISSING",
  "KEY_HIERARCHY_INVALID",
  "KEY_LINEAGE_INCOMPLETE",
  "CERTIFICATE_LIFECYCLE_MISSING",
  "CERTIFICATE_RENEWAL_FAILED",
  "SECRET_VAULT_MISSING",
  "SECRET_VERSIONING_MISSING",
  "SECRET_AUDITING_MISSING",
  "ENCRYPTION_AT_REST_MISSING",
  "STORAGE_ENCRYPTION_POLICY_INVALID",
  "BACKUP_ENCRYPTION_MISSING",
  "ENCRYPTION_IN_TRANSIT_MISSING",
  "TLS_CONFIGURATION_INVALID",
  "AUTOMATIC_ROTATION_MISSING",
  "ROTATION_SCHEDULE_INVALID",
  "ROTATION_VALIDATION_FAILED",
  "REVOCATION_MISSING",
  "RECOVERY_PROCEDURES_MISSING",
  "SECURE_SERVICE_COMMUNICATION_MISSING",
  "COMMUNICATION_AUDITING_MISSING",
  "SECURITY_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly SecurityFullFailure[] = [
  "W1_1B_IDENTITY_FULL_INVALID",
  "W1_2B_STORAGE_FULL_INVALID",
  "W1_3B_MESSAGING_FULL_INVALID",
  "W1_4B_REGISTRY_FULL_INVALID",
  "W1_5_CONFIGURATION_PLATFORM_INVALID",
  "W1_6_OBSERVABILITY_PLATFORM_INVALID",
  "W1_7A_SECURITY_CORE_INVALID",
  "KEY_DESTRUCTION_UNCONTROLLED",
  "CERTIFICATE_REVOCATION_FAILED",
  "TRUST_CHAIN_INVALID",
  "SECRET_POLICY_VIOLATED",
  "MUTUAL_TLS_FAILED",
  "REVOCATION_PROPAGATION_FAILED",
  "SERVICE_IDENTITY_VALIDATION_FAILED",
  "SERVICE_AUTHORIZATION_FAILED",
  "SECURITY_EVIDENCE_NOT_IMMUTABLE",
  "TENANT_ISOLATION_FAILED",
  "CRITICAL_SECURITY_FINDINGS_UNRESOLVED",
];

describe("W1.7B Security Full", () => {
  it("publishes security-full doctrine and validates baseline", () => {
    const bundle = getSecurityFullBundle();

    expect(bundle.doctrine.version).toBe("security-full/w1.7b");
    expect(bundle.doctrine.owns_production_key_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_certificate_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_secret_vault).toBe(true);
    expect(bundle.doctrine.owns_encryption_at_rest).toBe(true);
    expect(bundle.doctrine.owns_encryption_in_transit).toBe(true);
    expect(bundle.doctrine.owns_automatic_rotation).toBe(true);
    expect(bundle.doctrine.owns_revocation).toBe(true);
    expect(bundle.doctrine.owns_secure_service_communication).toBe(true);
    expect(bundle.doctrine.qualification_gate).toBe("Security Infrastructure Gate");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic security infrastructure qualification with full W1 references", () => {
    const first = runSecurityFull();
    const second = runSecurityFull();

    expect(first.phase_identifier).toBe("SecurityFull");
    expect(first.identity_full_ref).toBe("identity-full/w1.1b");
    expect(first.storage_full_ref).toBe("storage-full/w1.2b");
    expect(first.messaging_full_ref).toBe("messaging-full/w1.3b");
    expect(first.registry_full_ref).toBe("registry-full/w1.4b");
    expect(first.configuration_platform_ref).toBe("configuration-platform/w1.5");
    expect(first.observability_platform_ref).toBe("observability-platform/w1.6");
    expect(first.security_core_ref).toBe("security-core/w1.7a");
    expect(first.evidence.records).toHaveLength(8);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSecurityFull(first).valid).toBe(true);
    expect(replaySecurityFull(first)).toBe(true);
  });

  it("qualifies key lifecycle, certificate lifecycle, vault, and encryption", () => {
    const result = runSecurityFull();

    expect(result.key_lifecycle.key_hierarchy).toBe(true);
    expect(result.key_lifecycle.key_activation).toBe(true);
    expect(result.key_lifecycle.key_destruction).toBe(true);
    expect(result.key_lifecycle.key_lineage).toBe(true);
    expect(result.certificate_lifecycle.renewal).toBe(true);
    expect(result.certificate_lifecycle.rotation).toBe(true);
    expect(result.certificate_lifecycle.revocation).toBe(true);
    expect(result.certificate_lifecycle.trust_chains).toBe(true);
    expect(result.secret_vault.vault_operational).toBe(true);
    expect(result.secret_vault.secret_versioning).toBe(true);
    expect(result.secret_vault.secret_auditing).toBe(true);
    expect(result.encryption_at_rest.database_encryption).toBe(true);
    expect(result.encryption_at_rest.backup_encryption).toBe(true);
    expect(result.encryption_in_transit.mutual_tls).toBe(true);
    expect(result.encryption_in_transit.secure_messaging).toBe(true);
  });

  it("qualifies rotation, revocation, secure communication, evidence, and gate readiness", () => {
    const result = runSecurityFull();

    expect(result.rotation.automatic_key_rotation).toBe(true);
    expect(result.rotation.certificate_rotation).toBe(true);
    expect(result.rotation.secret_rotation).toBe(true);
    expect(result.rotation.rotation_validation).toBe(true);
    expect(result.revocation.key_revocation).toBe(true);
    expect(result.revocation.certificate_revocation).toBe(true);
    expect(result.revocation.revocation_propagation).toBe(true);
    expect(result.service_communication.service_identity_validation).toBe(true);
    expect(result.service_communication.mutual_authentication).toBe(true);
    expect(result.service_communication.service_authorization).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.reproducible).toBe(true);
    expect(result.qualification.tenant_isolation_validation).toBe(true);
    expect(result.qualification.gate_decision).toBe("QUALIFIED");
    expect(result.readiness.decision).toBe("QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks security full conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runSecurityFull({ scenario: failure });
    const validation = validateSecurityFull(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks security full not qualified when the infrastructure gate fails", () => {
    const result = runSecurityFull({ scenario: "SECURITY_INFRASTRUCTURE_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateSecurityFull(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical security full defect %s", (failure) => {
    const result = runSecurityFull({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateSecurityFull(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runSecurityFull({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runSecurityFull({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateSecurityFull(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
