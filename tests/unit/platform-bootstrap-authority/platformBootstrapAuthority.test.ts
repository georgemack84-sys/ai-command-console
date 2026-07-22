import { describe, expect, it } from "vitest";
import { getPlatformBootstrapAuthorityBundle, replayPlatformBootstrapAuthority, runPlatformBootstrapAuthority, validatePlatformBootstrapAuthority } from "@/services/platform-bootstrap-authority";
import type { BootstrapFailure } from "@/types/platform-bootstrap-authority";

const CONDITIONAL_FAILURES: readonly BootstrapFailure[] = [
  "BOOTSTRAP_ARCHITECTURE_MISSING",
  "BOOTSTRAP_LIFECYCLE_INCOMPLETE",
  "BOOTSTRAP_AUTHORITY_MODEL_INVALID",
  "KEY_CEREMONY_RECORDS_MISSING",
  "RECOVERY_PROCEDURES_MISSING",
  "BOOTSTRAP_CA_MISSING",
  "BOOTSTRAP_CERTIFICATE_POLICY_MISSING",
  "CERTIFICATE_LIFECYCLE_INVALID",
  "BOOTSTRAP_IDENTITY_MISSING",
  "BOOTSTRAP_PRINCIPAL_RECORDS_MISSING",
  "IDENTITY_VALIDATION_FAILED",
  "AUTHORIZATION_POLICY_MISSING",
  "ROLE_PERMISSION_MATRIX_INCOMPLETE",
  "PERMISSION_GRANTS_INVALID",
  "BOOTSTRAP_NAMESPACE_MISSING",
  "NAMESPACE_OWNERSHIP_INVALID",
  "BOOTSTRAP_TENANT_MISSING",
  "TENANT_BOUNDARY_INVALID",
  "AUDIT_LEDGER_MISSING",
  "AUDIT_RECORDS_INCOMPLETE",
  "MULTI_PARTY_AUTHORIZATION_MISSING",
  "BACKUP_MATERIAL_UNSECURED",
  "BOOTSTRAP_VALIDATION_FAILED",
];

describe("W1.0 Platform Bootstrap Authority", () => {
  it("publishes bootstrap doctrine and validates the baseline", () => {
    const bundle = getPlatformBootstrapAuthorityBundle();

    expect(bundle.doctrine.version).toBe("platform-bootstrap-authority/w1.0");
    expect(bundle.doctrine.owns_offline_root_of_trust).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_authority).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_identity).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_authorization).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_tenant).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_namespace).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_audit_ledger).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic bootstrap authority initialization", () => {
    const first = runPlatformBootstrapAuthority();
    const second = runPlatformBootstrapAuthority();

    expect(first.phase_identifier).toBe("PlatformBootstrapAuthority");
    expect(first.architecture.lifecycle_defined).toBe(true);
    expect(first.root_of_trust.offline_root_keys).toHaveLength(2);
    expect(first.authorization.deterministic_decisions).toBe(true);
    expect(first.role_permission_matrix.roles).toHaveLength(3);
    expect(first.role_permission_matrix.permissions).toHaveLength(9);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePlatformBootstrapAuthority(first).valid).toBe(true);
    expect(replayPlatformBootstrapAuthority(first)).toBe(true);
  });

  it("creates root trust, certificate authority, identity, authorization, roles, namespace, and tenant artifacts", () => {
    const result = runPlatformBootstrapAuthority();

    expect(result.root_of_trust.immutable).toBe(true);
    expect(result.certificate_authority.authority_operational).toBe(true);
    expect(result.identity_registry.identities_validated).toBe(true);
    expect(result.authorization.evaluator_operational).toBe(true);
    expect(result.role_permission_matrix.matrix_complete).toBe(true);
    expect(result.namespace_registry.bootstrap_namespace).toBe("civitas.bootstrap");
    expect(result.tenant.tenant_isolation_established).toBe(true);
  });

  it("records immutable audit evidence and passes bootstrap validation and qualification", () => {
    const result = runPlatformBootstrapAuthority();

    expect(result.audit_ledger.records).toHaveLength(6);
    expect(result.audit_ledger.immutable).toBe(true);
    expect(result.security_report.private_keys_secured).toBe(true);
    expect(result.security_report.multi_party_authorization_enabled).toBe(true);
    expect(result.validation_report.evidence_immutable).toBe(true);
    expect(result.qualification_report.qualification_gate_passed).toBe(true);
    expect(result.readiness.decision).toBe("BOOTSTRAP_READY");
    expect(result.readiness.phase_ready).toBe(true);
  });

  it.each(CONDITIONAL_FAILURES)("marks bootstrap conditionally ready for remediable deficiency %s", (failure) => {
    const result = runPlatformBootstrapAuthority({ scenario: failure });
    const validation = validatePlatformBootstrapAuthority(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["LAYER_0_CONSTITUTIONAL_FRAMEWORK_MISSING", "CAPABILITY_ATLAS_MISSING", "PLATFORM_GOVERNANCE_STANDARDS_MISSING", "BOOTSTRAP_QUALIFICATION_GATE_FAILED"] as const)("marks bootstrap not ready for dependency or qualification blocker %s", (failure) => {
    const result = runPlatformBootstrapAuthority({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_READY");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.qualification_report.qualification_gate_passed).toBe(false);
    expect(validatePlatformBootstrapAuthority(result).valid).toBe(false);
  });

  it.each(["OFFLINE_ROOT_OF_TRUST_MISSING", "ROOT_KEYS_NOT_GENERATED", "ROOT_KEYS_NOT_IMMUTABLE", "BOOTSTRAP_AUTHORIZATION_MISSING", "AUTHORIZATION_DECISION_NON_DETERMINISTIC", "AUDIT_LEDGER_NOT_IMMUTABLE", "BOOTSTRAP_CREDENTIALS_UNSECURED", "PRIVATE_KEYS_UNPROTECTED", "BOOTSTRAP_EVIDENCE_NOT_IMMUTABLE"] as const)("fails closed for critical bootstrap trust or evidence defect %s", (failure) => {
    const result = runPlatformBootstrapAuthority({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validatePlatformBootstrapAuthority(result).valid).toBe(false);
  });

  it("supports ready with observations but keeps conditional follow-up out of full readiness", () => {
    const observed = runPlatformBootstrapAuthority({ scenario: "READY_WITH_OBSERVATIONS" });
    const conditional = runPlatformBootstrapAuthority({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("READY_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validatePlatformBootstrapAuthority(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_READY");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
