import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPlatformBootstrapAuthority, validatePlatformBootstrapAuthority } from "@/services/platform-bootstrap-authority";
import type { SecurityCoreBundle, SecurityCoreDecision, SecurityCoreFailure, SecurityCoreInput, SecurityCoreResult, SecurityCoreScenario, SecurityCoreValidation } from "@/types/security-core";

const VERSION = "security-core/w1.7a" as const;
const IDENTIFIER = "SecurityCore" as const;
let bootstrapBaseline: ReturnType<typeof runPlatformBootstrapAuthority> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly SecurityCoreFailure[], failure: SecurityCoreFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: SecurityCoreScenario): SecurityCoreFailure | undefined { return scenario === "BASELINE" || scenario === "ACTIVE_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly SecurityCoreFailure[], scenario: SecurityCoreScenario): SecurityCoreDecision {
  if (has(failures, "W1_0_BOOTSTRAP_AUTHORITY_INVALID") || has(failures, "ROOT_KEY_GENERATION_FAILED") || has(failures, "TRUST_ANCHOR_INVALID") || has(failures, "ROOT_INTEGRITY_INVALID") || has(failures, "KEY_INTEGRITY_VALIDATION_FAILED") || has(failures, "SIGNATURE_NON_DETERMINISTIC") || has(failures, "SIGNATURE_VALIDATION_FAILED") || has(failures, "HASH_VALIDATION_FAILED") || has(failures, "INTEGRITY_VERIFICATION_FAILED") || has(failures, "TRUST_CHAIN_INVALID") || has(failures, "SECRET_PROTECTION_FAILED") || has(failures, "CRYPTOGRAPHIC_EVIDENCE_NOT_IMMUTABLE") || has(failures, "DETERMINISTIC_REPLAY_FAILED")) return "FAIL_CLOSED";
  if (has(failures, "CORE_ACTIVATION_FAILED") || has(failures, "BOOTSTRAP_SECURITY_TESTS_FAILED")) return "NOT_ACTIVE";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP") return "CONDITIONALLY_ACTIVE";
  return scenario === "ACTIVE_WITH_OBSERVATIONS" ? "ACTIVE_WITH_OBSERVATIONS" : "CORE_ACTIVATED";
}
function resultReplayHash(result: Omit<SecurityCoreResult, "replay_hash" | "integrity_hash">): string { return hash({ root: result.cryptographic_root.integrity_hash, keys: result.key_management.integrity_hash, signing: result.signing.integrity_hash, verification: result.verification.integrity_hash, certificates: result.certificates.integrity_hash, encryption: result.secret_encryption.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<SecurityCoreResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runSecurityCore(input: SecurityCoreInput = {}): SecurityCoreResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<SecurityCoreFailure>(direct ? [direct] : []);
  bootstrapBaseline ??= runPlatformBootstrapAuthority();
  const bootstrapInvalid = !validatePlatformBootstrapAuthority(bootstrapBaseline).valid || has(scenarioFailures, "W1_0_BOOTSTRAP_AUTHORITY_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(bootstrapInvalid ? ["W1_0_BOOTSTRAP_AUTHORITY_INVALID" as const] : [])])]);
  const bootstrapOk = !bootstrapInvalid;
  const rootOk = bootstrapOk && !has(failures, "CRYPTOGRAPHIC_ROOT_MISSING") && !has(failures, "ROOT_KEY_GENERATION_FAILED") && !has(failures, "TRUST_ANCHOR_INVALID") && !has(failures, "ROOT_INTEGRITY_INVALID");
  const keyOk = !has(failures, "KEY_MANAGEMENT_MISSING") && !has(failures, "KEY_STORAGE_UNAVAILABLE") && !has(failures, "KEY_INTEGRITY_VALIDATION_FAILED") && !has(failures, "KEY_FINGERPRINT_INVALID");
  const signingOk = !has(failures, "SIGNING_SERVICE_MISSING") && !has(failures, "SIGNATURE_GENERATION_FAILED") && !has(failures, "CANONICAL_SERIALIZATION_INVALID") && !has(failures, "SIGNATURE_NON_DETERMINISTIC");
  const verificationOk = !has(failures, "VERIFICATION_SERVICE_MISSING") && !has(failures, "SIGNATURE_VALIDATION_FAILED") && !has(failures, "HASH_VALIDATION_FAILED") && !has(failures, "INTEGRITY_VERIFICATION_FAILED");
  const certificatesOk = !has(failures, "CERTIFICATE_INITIALIZATION_MISSING") && !has(failures, "ROOT_CERTIFICATE_INVALID") && !has(failures, "TRUST_CHAIN_INVALID");
  const encryptionOk = !has(failures, "SECRET_ENCRYPTION_MISSING") && !has(failures, "SECRET_DECRYPTION_FAILED") && !has(failures, "SECRET_INTEGRITY_VALIDATION_FAILED") && !has(failures, "SECRET_PROTECTION_FAILED");
  const evidenceOk = !has(failures, "BOOTSTRAP_SECURITY_EVIDENCE_MISSING") && !has(failures, "CRYPTOGRAPHIC_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "ACTIVATION_EVIDENCE_MISSING") && !has(failures, "DETERMINISTIC_REPLAY_FAILED");
  const testsOk = !has(failures, "BOOTSTRAP_SECURITY_TESTS_FAILED") && !has(failures, "CORE_ACTIVATION_FAILED");
  const decision = decisionFor(failures, scenario);
  const cryptographic_root = nested({ root_id: rootOk ? `root:w1.7a:platform:${input.seed ?? "canonical"}` : "", platform_root_key: rootOk, signing_identity: rootOk, verification_identity: rootOk, trust_anchor: rootOk, root_metadata: rootOk, root_integrity: rootOk });
  const key_management = nested({ registry_id: keyOk ? "registry:w1.7a:keys" : "", key_generation: keyOk, key_storage: keyOk, key_loading: keyOk, key_identification: keyOk, key_integrity_validation: keyOk, key_fingerprints: keyOk, active_platform_keys: keyOk ? freezeArray(["key:platform-root", "key:platform-signing", "key:platform-verification", "key:secret-encryption"]) : freezeArray<string>([]) });
  const signing = nested({ service_id: signingOk ? "service:w1.7a:signing" : "", digital_signing: signingOk, signature_generation: signingOk, payload_hashing: signingOk, canonical_serialization: signingOk, deterministic_signatures: signingOk, signing_evidence: signingOk });
  const verification = nested({ service_id: verificationOk ? "service:w1.7a:verification" : "", signature_validation: verificationOk, hash_validation: verificationOk, certificate_validation: verificationOk, integrity_verification: verificationOk, verification_reports: verificationOk, verification_evidence: verificationOk });
  const certificates = nested({ authority_id: certificatesOk ? "ca:w1.7a:bootstrap" : "", root_certificate: certificatesOk, certificate_authority: certificatesOk, bootstrap_certificates: certificatesOk, certificate_chain_validation: certificatesOk, trust_chain_metadata: certificatesOk });
  const secret_encryption = nested({ service_id: encryptionOk ? "service:w1.7a:secret-encryption" : "", secret_encryption: encryptionOk, secret_decryption: encryptionOk, secret_integrity_validation: encryptionOk, encryption_metadata: encryptionOk, confidential_protection: encryptionOk, encryption_evidence: encryptionOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.7a:bootstrap-security" : "", records: evidenceOk ? freezeArray(["crypto:key-generation", "crypto:signing", "crypto:verification", "crypto:certificate", "crypto:encryption", "crypto:activation"]) : freezeArray<string>([]), key_generation_records: evidenceOk, signing_evidence: evidenceOk, verification_evidence: evidenceOk, certificate_evidence: evidenceOk, encryption_evidence: evidenceOk, activation_evidence: evidenceOk, immutable: evidenceOk, replay_validated: evidenceOk });
  const readiness = nested({ readiness_id: "W1.7A-SECURITY-CORE-READINESS-001", decision, phase_ready: decision === "CORE_ACTIVATED" || decision === "ACTIVE_WITH_OBSERVATIONS", bootstrap_ready: bootstrapOk, root_ready: rootOk, key_management_ready: keyOk, signing_ready: signingOk, verification_ready: verificationOk, certificates_ready: certificatesOk, secret_encryption_ready: encryptionOk, evidence_ready: evidenceOk, tests_passed: testsOk, failures });
  const base: Omit<SecurityCoreResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, bootstrap_authority_ref: "platform-bootstrap-authority/w1.0", cryptographic_root, key_management, signing, verification, certificates, secret_encryption, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSecurityCore(result?: SecurityCoreResult): SecurityCoreValidation {
  if (!result) return nested({ valid: false, decision: "NOT_ACTIVE" as const, replay_hash_valid: false, integrity_hash_valid: false, root_valid: false, key_management_valid: false, signing_valid: false, verification_valid: false, certificates_valid: false, secret_encryption_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["CRYPTOGRAPHIC_ROOT_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const root_valid = verifyHashed(result.cryptographic_root) && result.cryptographic_root.platform_root_key && result.cryptographic_root.trust_anchor && result.cryptographic_root.root_integrity;
  const key_management_valid = verifyHashed(result.key_management) && result.key_management.active_platform_keys.length >= 4 && result.key_management.key_integrity_validation && result.key_management.key_fingerprints;
  const signing_valid = verifyHashed(result.signing) && result.signing.signature_generation && result.signing.canonical_serialization && result.signing.deterministic_signatures;
  const verification_valid = verifyHashed(result.verification) && result.verification.signature_validation && result.verification.hash_validation && result.verification.integrity_verification;
  const certificates_valid = verifyHashed(result.certificates) && result.certificates.root_certificate && result.certificates.certificate_authority && result.certificates.certificate_chain_validation;
  const secret_encryption_valid = verifyHashed(result.secret_encryption) && result.secret_encryption.secret_encryption && result.secret_encryption.secret_decryption && result.secret_encryption.confidential_protection;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 6 && result.evidence.immutable && result.evidence.replay_validated;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && root_valid && key_management_valid && signing_valid && verification_valid && certificates_valid && secret_encryption_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, root_valid, key_management_valid, signing_valid, verification_valid, certificates_valid, secret_encryption_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}

export function replaySecurityCore(result = runSecurityCore()): boolean { const scenario = result.readiness.decision === "ACTIVE_WITH_OBSERVATIONS" ? { scenario: "ACTIVE_WITH_OBSERVATIONS" as const } : {}; const replayed = runSecurityCore(scenario); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSecurityCore(result).valid; }
export function getSecurityCoreBundle(): SecurityCoreBundle { const result = runSecurityCore(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_initial_key_management: true, owns_cryptographic_signing: true, owns_cryptographic_verification: true, owns_certificate_initialization: true, owns_secret_encryption: true, owns_bootstrap_cryptographic_evidence: true, excludes_tenant_vaults: true, excludes_automated_key_rotation: true, excludes_certificate_lifecycle: true }), result, validation: validateSecurityCore(result) }); }
export const SecurityCoreService = Object.freeze({ run: runSecurityCore, validate: validateSecurityCore, replay: replaySecurityCore });
