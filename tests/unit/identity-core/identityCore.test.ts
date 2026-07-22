import { describe, expect, it } from "vitest";
import { getIdentityCoreBundle, replayIdentityCore, runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import type { IdentityCoreFailure } from "@/types/identity-core";

const CONDITIONAL_FAILURES: readonly IdentityCoreFailure[] = [
  "PRODUCTION_IDENTITY_FOUNDATION_MISSING",
  "PLATFORM_IDENTITY_AUTHORITY_MISSING",
  "IDENTITY_REGISTRY_MISSING",
  "SYSTEM_IDENTITIES_MISSING",
  "INFRASTRUCTURE_IDENTITIES_MISSING",
  "PRODUCTION_OWNERSHIP_INVALID",
  "BOOTSTRAP_AUTHORITY_NOT_VALIDATED",
  "PRODUCTION_TRUST_CHAIN_MISSING",
  "IDENTITY_OWNERSHIP_TRANSFER_FAILED",
  "AUTHORITY_TRANSFER_EVIDENCE_MISSING",
  "PLATFORM_IDENTITY_MISSING",
  "PLATFORM_CREDENTIALS_MISSING",
  "TENANT_IDENTITY_MODEL_MISSING",
  "TENANT_IDENTITIES_NOT_UNIQUE",
  "TENANT_REGISTRY_MISSING",
  "NAMESPACE_IDENTITIES_MISSING",
  "NAMESPACE_TENANT_BINDING_INVALID",
  "NAMESPACE_IDENTITIES_NOT_UNIQUE",
  "NAMESPACE_REGISTRY_MISSING",
  "AUTHENTICATION_SERVICE_MISSING",
  "CREDENTIAL_VALIDATION_FAILED",
  "CERTIFICATE_AUTHENTICATION_FAILED",
  "TOKEN_AUTHENTICATION_FAILED",
  "AUTHORIZATION_SERVICE_MISSING",
  "AUTHORIZATION_POLICY_MISSING",
  "PERMISSION_BINDINGS_INVALID",
  "AUTHORIZATION_DECISION_INVALID",
  "IDENTITY_TOKEN_SERVICE_MISSING",
  "TOKEN_VALIDATION_FAILED",
  "TOKEN_EXPIRATION_INVALID",
  "IDENTITY_LIFECYCLE_MISSING",
  "LIFECYCLE_TRANSITIONS_INVALID",
  "IDENTITY_AUDIT_LEDGER_MISSING",
  "IDENTITY_AUDIT_RECORDS_INCOMPLETE",
];

describe("W1.1A Identity Core", () => {
  it("publishes identity core doctrine and validates baseline activation", () => {
    const bundle = getIdentityCoreBundle();

    expect(bundle.doctrine.version).toBe("identity-core/w1.1a");
    expect(bundle.doctrine.owns_platform_identity).toBe(true);
    expect(bundle.doctrine.owns_identity_authority).toBe(true);
    expect(bundle.doctrine.owns_tenant_identity).toBe(true);
    expect(bundle.doctrine.owns_namespace_identity).toBe(true);
    expect(bundle.doctrine.owns_authentication_services).toBe(true);
    expect(bundle.doctrine.owns_authorization_services).toBe(true);
    expect(bundle.doctrine.owns_identity_tokens).toBe(true);
    expect(bundle.doctrine.owns_identity_audit).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic identity core activation with W1.0 bootstrap dependency", () => {
    const first = runIdentityCore();
    const second = runIdentityCore();

    expect(first.phase_identifier).toBe("IdentityCore");
    expect(first.bootstrap_ref).toBe("platform-bootstrap-authority/w1.0");
    expect(first.foundation.platform_identity_authority).toBe("authority:w1.1a:production-identity");
    expect(first.authority_transfer.signing_authority_transferred).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateIdentityCore(first).valid).toBe(true);
    expect(replayIdentityCore(first)).toBe(true);
  });

  it("creates production platform, tenant, and namespace identity registries", () => {
    const result = runIdentityCore();

    expect(result.platform_identity.registered).toBe(true);
    expect(result.platform_identity.production_credentials).toHaveLength(2);
    expect(result.tenant_registry.tenant_model_defined).toBe(true);
    expect(result.tenant_registry.identifiers_unique).toBe(true);
    expect(result.namespace_registry.tenant_bindings_valid).toBe(true);
    expect(result.namespace_registry.identifiers_unique).toBe(true);
  });

  it("deploys authentication, authorization, token, lifecycle, and immutable audit services", () => {
    const result = runIdentityCore();

    expect(result.authentication_service.deployed).toBe(true);
    expect(result.authentication_service.invalid_credentials_rejected).toBe(true);
    expect(result.authorization_service.unauthorized_requests_denied).toBe(true);
    expect(result.token_service.signed_tokens).toHaveLength(3);
    expect(result.token_service.deterministic_signatures).toBe(true);
    expect(result.lifecycle.states).toEqual(["CREATED", "REGISTERED", "VERIFIED", "ACTIVE", "SUSPENDED", "RESTORED", "RETIRED"]);
    expect(result.audit_evidence.immutable).toBe(true);
    expect(result.audit_evidence.lineage_complete).toBe(true);
  });

  it("achieves CORE_ACTIVATED readiness", () => {
    const result = runIdentityCore();

    expect(result.readiness.decision).toBe("CORE_ACTIVATED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.foundation_ready).toBe(true);
    expect(result.readiness.transfer_ready).toBe(true);
    expect(result.readiness.authentication_ready).toBe(true);
    expect(result.readiness.authorization_ready).toBe(true);
    expect(result.readiness.token_ready).toBe(true);
    expect(result.readiness.audit_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks identity core conditionally active for remediable deficiency %s", (failure) => {
    const result = runIdentityCore({ scenario: failure });
    const validation = validateIdentityCore(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["STORAGE_CORE_MISSING", "SECURITY_CORE_MISSING"] as const)("marks identity core not active for required core dependency %s", (failure) => {
    const result = runIdentityCore({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_ACTIVE");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateIdentityCore(result).valid).toBe(false);
  });

  it.each(["W1_0_BOOTSTRAP_INVALID", "AUTHORITY_TRANSFER_FAILED", "SIGNING_AUTHORITY_TRANSFER_FAILED", "INVALID_CREDENTIALS_ACCEPTED", "UNAUTHORIZED_REQUEST_ALLOWED", "TOKEN_SIGNING_FAILED", "TOKEN_SIGNATURE_NON_DETERMINISTIC", "IDENTITY_EVIDENCE_NOT_IMMUTABLE", "IDENTITY_REPLAY_FAILED"] as const)("fails closed for critical identity trust defect %s", (failure) => {
    const result = runIdentityCore({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateIdentityCore(result).valid).toBe(false);
  });

  it("supports active with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runIdentityCore({ scenario: "ACTIVE_WITH_OBSERVATIONS" });
    const conditional = runIdentityCore({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("ACTIVE_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateIdentityCore(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
