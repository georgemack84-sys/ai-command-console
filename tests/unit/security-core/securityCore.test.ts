import { describe, expect, it } from "vitest";
import { getSecurityCoreBundle, replaySecurityCore, runSecurityCore, validateSecurityCore } from "@/services/security-core";
import type { SecurityCoreFailure } from "@/types/security-core";

const CONDITIONAL_FAILURES: readonly SecurityCoreFailure[] = [
  "CRYPTOGRAPHIC_ROOT_MISSING",
  "KEY_MANAGEMENT_MISSING",
  "KEY_STORAGE_UNAVAILABLE",
  "KEY_FINGERPRINT_INVALID",
  "SIGNING_SERVICE_MISSING",
  "SIGNATURE_GENERATION_FAILED",
  "CANONICAL_SERIALIZATION_INVALID",
  "VERIFICATION_SERVICE_MISSING",
  "CERTIFICATE_INITIALIZATION_MISSING",
  "ROOT_CERTIFICATE_INVALID",
  "SECRET_ENCRYPTION_MISSING",
  "SECRET_DECRYPTION_FAILED",
  "SECRET_INTEGRITY_VALIDATION_FAILED",
  "BOOTSTRAP_SECURITY_EVIDENCE_MISSING",
  "ACTIVATION_EVIDENCE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly SecurityCoreFailure[] = [
  "W1_0_BOOTSTRAP_AUTHORITY_INVALID",
  "ROOT_KEY_GENERATION_FAILED",
  "TRUST_ANCHOR_INVALID",
  "ROOT_INTEGRITY_INVALID",
  "KEY_INTEGRITY_VALIDATION_FAILED",
  "SIGNATURE_NON_DETERMINISTIC",
  "SIGNATURE_VALIDATION_FAILED",
  "HASH_VALIDATION_FAILED",
  "INTEGRITY_VERIFICATION_FAILED",
  "TRUST_CHAIN_INVALID",
  "SECRET_PROTECTION_FAILED",
  "CRYPTOGRAPHIC_EVIDENCE_NOT_IMMUTABLE",
  "DETERMINISTIC_REPLAY_FAILED",
];

describe("W1.7A Security Core", () => {
  it("publishes security-core doctrine and validates baseline", () => {
    const bundle = getSecurityCoreBundle();

    expect(bundle.doctrine.version).toBe("security-core/w1.7a");
    expect(bundle.doctrine.owns_initial_key_management).toBe(true);
    expect(bundle.doctrine.owns_cryptographic_signing).toBe(true);
    expect(bundle.doctrine.owns_cryptographic_verification).toBe(true);
    expect(bundle.doctrine.owns_certificate_initialization).toBe(true);
    expect(bundle.doctrine.owns_secret_encryption).toBe(true);
    expect(bundle.doctrine.owns_bootstrap_cryptographic_evidence).toBe(true);
    expect(bundle.doctrine.excludes_tenant_vaults).toBe(true);
    expect(bundle.doctrine.excludes_automated_key_rotation).toBe(true);
    expect(bundle.doctrine.excludes_certificate_lifecycle).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic security-core activation with bootstrap authority reference", () => {
    const first = runSecurityCore();
    const second = runSecurityCore();

    expect(first.phase_identifier).toBe("SecurityCore");
    expect(first.bootstrap_authority_ref).toBe("platform-bootstrap-authority/w1.0");
    expect(first.key_management.active_platform_keys).toHaveLength(4);
    expect(first.evidence.records).toHaveLength(6);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSecurityCore(first).valid).toBe(true);
    expect(replaySecurityCore(first)).toBe(true);
  });

  it("provides cryptographic root, key management, signing, and verification", () => {
    const result = runSecurityCore();

    expect(result.cryptographic_root.platform_root_key).toBe(true);
    expect(result.cryptographic_root.trust_anchor).toBe(true);
    expect(result.cryptographic_root.root_integrity).toBe(true);
    expect(result.key_management.key_generation).toBe(true);
    expect(result.key_management.key_integrity_validation).toBe(true);
    expect(result.key_management.key_fingerprints).toBe(true);
    expect(result.signing.signature_generation).toBe(true);
    expect(result.signing.canonical_serialization).toBe(true);
    expect(result.signing.deterministic_signatures).toBe(true);
    expect(result.verification.signature_validation).toBe(true);
    expect(result.verification.hash_validation).toBe(true);
    expect(result.verification.integrity_verification).toBe(true);
  });

  it("provides certificate initialization, secret encryption, and immutable bootstrap evidence", () => {
    const result = runSecurityCore();

    expect(result.certificates.root_certificate).toBe(true);
    expect(result.certificates.certificate_authority).toBe(true);
    expect(result.certificates.certificate_chain_validation).toBe(true);
    expect(result.secret_encryption.secret_encryption).toBe(true);
    expect(result.secret_encryption.secret_decryption).toBe(true);
    expect(result.secret_encryption.confidential_protection).toBe(true);
    expect(result.evidence.key_generation_records).toBe(true);
    expect(result.evidence.signing_evidence).toBe(true);
    expect(result.evidence.verification_evidence).toBe(true);
    expect(result.evidence.activation_evidence).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.replay_validated).toBe(true);
    expect(result.readiness.decision).toBe("CORE_ACTIVATED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks security core conditionally active for remediable deficiency %s", (failure) => {
    const result = runSecurityCore({ scenario: failure });
    const validation = validateSecurityCore(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it.each(["CORE_ACTIVATION_FAILED", "BOOTSTRAP_SECURITY_TESTS_FAILED"] as const)("marks security core not active for activation blocker %s", (failure) => {
    const result = runSecurityCore({ scenario: failure });

    expect(result.readiness.decision).toBe("NOT_ACTIVE");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateSecurityCore(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical cryptographic defect %s", (failure) => {
    const result = runSecurityCore({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateSecurityCore(result).valid).toBe(false);
  });

  it("supports active with observations but keeps conditional follow-up out of readiness", () => {
    const observed = runSecurityCore({ scenario: "ACTIVE_WITH_OBSERVATIONS" });
    const conditional = runSecurityCore({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("ACTIVE_WITH_OBSERVATIONS");
    expect(observed.readiness.phase_ready).toBe(true);
    expect(validateSecurityCore(observed).valid).toBe(true);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_ACTIVE");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
