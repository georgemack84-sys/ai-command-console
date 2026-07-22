import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import { runMessagingFull, validateMessagingFull } from "@/services/messaging-full";
import { runObservabilityPlatform, validateObservabilityPlatform } from "@/services/observability-platform";
import { runRegistryFull, validateRegistryFull } from "@/services/registry-full";
import { runSecurityCore, validateSecurityCore } from "@/services/security-core";
import { runStorageFull, validateStorageFull } from "@/services/storage-full";
import type { SecurityFullBundle, SecurityFullDecision, SecurityFullFailure, SecurityFullInput, SecurityFullResult, SecurityFullScenario, SecurityFullValidation } from "@/types/security-full";

const VERSION = "security-full/w1.7b" as const;
const IDENTIFIER = "SecurityFull" as const;
let identityBaseline: ReturnType<typeof runIdentityFull> | undefined;
let storageBaseline: ReturnType<typeof runStorageFull> | undefined;
let messagingBaseline: ReturnType<typeof runMessagingFull> | undefined;
let registryBaseline: ReturnType<typeof runRegistryFull> | undefined;
let configurationBaseline: ReturnType<typeof runConfigurationPlatform> | undefined;
let observabilityBaseline: ReturnType<typeof runObservabilityPlatform> | undefined;
let securityCoreBaseline: ReturnType<typeof runSecurityCore> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly SecurityFullFailure[], failure: SecurityFullFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: SecurityFullScenario): SecurityFullFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly SecurityFullFailure[], scenario: SecurityFullScenario): SecurityFullDecision {
  if (has(failures, "W1_1B_IDENTITY_FULL_INVALID") || has(failures, "W1_2B_STORAGE_FULL_INVALID") || has(failures, "W1_3B_MESSAGING_FULL_INVALID") || has(failures, "W1_4B_REGISTRY_FULL_INVALID") || has(failures, "W1_5_CONFIGURATION_PLATFORM_INVALID") || has(failures, "W1_6_OBSERVABILITY_PLATFORM_INVALID") || has(failures, "W1_7A_SECURITY_CORE_INVALID") || has(failures, "KEY_DESTRUCTION_UNCONTROLLED") || has(failures, "CERTIFICATE_REVOCATION_FAILED") || has(failures, "TRUST_CHAIN_INVALID") || has(failures, "SECRET_POLICY_VIOLATED") || has(failures, "MUTUAL_TLS_FAILED") || has(failures, "REVOCATION_PROPAGATION_FAILED") || has(failures, "SERVICE_IDENTITY_VALIDATION_FAILED") || has(failures, "SERVICE_AUTHORIZATION_FAILED") || has(failures, "SECURITY_EVIDENCE_NOT_IMMUTABLE") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "CRITICAL_SECURITY_FINDINGS_UNRESOLVED")) return "FAIL_CLOSED";
  if (has(failures, "SECURITY_INFRASTRUCTURE_GATE_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "QUALIFIED";
}
function resultReplayHash(result: Omit<SecurityFullResult, "replay_hash" | "integrity_hash">): string { return hash({ keys: result.key_lifecycle.integrity_hash, certs: result.certificate_lifecycle.integrity_hash, vault: result.secret_vault.integrity_hash, rest: result.encryption_at_rest.integrity_hash, transit: result.encryption_in_transit.integrity_hash, rotation: result.rotation.integrity_hash, revocation: result.revocation.integrity_hash, comms: result.service_communication.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<SecurityFullResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runSecurityFull(input: SecurityFullInput = {}): SecurityFullResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<SecurityFullFailure>(direct ? [direct] : []);
  identityBaseline ??= runIdentityFull();
  storageBaseline ??= runStorageFull();
  messagingBaseline ??= runMessagingFull();
  registryBaseline ??= runRegistryFull();
  configurationBaseline ??= runConfigurationPlatform();
  observabilityBaseline ??= runObservabilityPlatform();
  securityCoreBaseline ??= runSecurityCore();
  const identityInvalid = !validateIdentityFull(identityBaseline).valid || has(scenarioFailures, "W1_1B_IDENTITY_FULL_INVALID");
  const storageInvalid = !validateStorageFull(storageBaseline).valid || has(scenarioFailures, "W1_2B_STORAGE_FULL_INVALID");
  const messagingInvalid = !validateMessagingFull(messagingBaseline).valid || has(scenarioFailures, "W1_3B_MESSAGING_FULL_INVALID");
  const registryInvalid = !validateRegistryFull(registryBaseline).valid || has(scenarioFailures, "W1_4B_REGISTRY_FULL_INVALID");
  const configurationInvalid = !validateConfigurationPlatform(configurationBaseline).valid || has(scenarioFailures, "W1_5_CONFIGURATION_PLATFORM_INVALID");
  const observabilityInvalid = !validateObservabilityPlatform(observabilityBaseline).valid || has(scenarioFailures, "W1_6_OBSERVABILITY_PLATFORM_INVALID");
  const securityCoreInvalid = !validateSecurityCore(securityCoreBaseline).valid || has(scenarioFailures, "W1_7A_SECURITY_CORE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(identityInvalid ? ["W1_1B_IDENTITY_FULL_INVALID" as const] : []), ...(storageInvalid ? ["W1_2B_STORAGE_FULL_INVALID" as const] : []), ...(messagingInvalid ? ["W1_3B_MESSAGING_FULL_INVALID" as const] : []), ...(registryInvalid ? ["W1_4B_REGISTRY_FULL_INVALID" as const] : []), ...(configurationInvalid ? ["W1_5_CONFIGURATION_PLATFORM_INVALID" as const] : []), ...(observabilityInvalid ? ["W1_6_OBSERVABILITY_PLATFORM_INVALID" as const] : []), ...(securityCoreInvalid ? ["W1_7A_SECURITY_CORE_INVALID" as const] : [])])]);
  const identityOk = !identityInvalid;
  const storageOk = !storageInvalid;
  const messagingOk = !messagingInvalid;
  const registryOk = !registryInvalid;
  const configurationOk = !configurationInvalid;
  const observabilityOk = !observabilityInvalid;
  const securityCoreOk = !securityCoreInvalid;
  const keyOk = !has(failures, "PRODUCTION_KEY_LIFECYCLE_MISSING") && !has(failures, "KEY_HIERARCHY_INVALID") && !has(failures, "KEY_LINEAGE_INCOMPLETE") && !has(failures, "KEY_DESTRUCTION_UNCONTROLLED");
  const certificateOk = !has(failures, "CERTIFICATE_LIFECYCLE_MISSING") && !has(failures, "CERTIFICATE_RENEWAL_FAILED") && !has(failures, "CERTIFICATE_REVOCATION_FAILED") && !has(failures, "TRUST_CHAIN_INVALID");
  const vaultOk = !has(failures, "SECRET_VAULT_MISSING") && !has(failures, "SECRET_VERSIONING_MISSING") && !has(failures, "SECRET_POLICY_VIOLATED") && !has(failures, "SECRET_AUDITING_MISSING");
  const restOk = storageOk && !has(failures, "ENCRYPTION_AT_REST_MISSING") && !has(failures, "STORAGE_ENCRYPTION_POLICY_INVALID") && !has(failures, "BACKUP_ENCRYPTION_MISSING");
  const transitOk = !has(failures, "ENCRYPTION_IN_TRANSIT_MISSING") && !has(failures, "TLS_CONFIGURATION_INVALID") && !has(failures, "MUTUAL_TLS_FAILED");
  const rotationOk = !has(failures, "AUTOMATIC_ROTATION_MISSING") && !has(failures, "ROTATION_SCHEDULE_INVALID") && !has(failures, "ROTATION_VALIDATION_FAILED");
  const revocationOk = !has(failures, "REVOCATION_MISSING") && !has(failures, "REVOCATION_PROPAGATION_FAILED") && !has(failures, "RECOVERY_PROCEDURES_MISSING");
  const communicationOk = identityOk && messagingOk && !has(failures, "SECURE_SERVICE_COMMUNICATION_MISSING") && !has(failures, "SERVICE_IDENTITY_VALIDATION_FAILED") && !has(failures, "SERVICE_AUTHORIZATION_FAILED") && !has(failures, "COMMUNICATION_AUDITING_MISSING");
  const evidenceOk = observabilityOk && !has(failures, "SECURITY_EVIDENCE_MISSING") && !has(failures, "SECURITY_EVIDENCE_NOT_IMMUTABLE");
  const tenantOk = !has(failures, "TENANT_ISOLATION_FAILED");
  const findingsOk = !has(failures, "CRITICAL_SECURITY_FINDINGS_UNRESOLVED");
  const gateOk = !has(failures, "SECURITY_INFRASTRUCTURE_GATE_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "QUALIFIED";
  const key_lifecycle = nested({ registry_id: keyOk ? `registry:w1.7b:production-keys:${input.seed ?? "canonical"}` : "", key_hierarchy: keyOk, key_generation: keyOk, key_activation: keyOk, key_suspension: keyOk, key_expiration: keyOk, key_archival: keyOk, key_destruction: keyOk, key_lineage: keyOk });
  const certificate_lifecycle = nested({ registry_id: certificateOk ? "registry:w1.7b:certificates" : "", certificate_issuance: certificateOk, renewal: certificateOk, rotation: certificateOk, revocation: certificateOk, trust_chains: certificateOk, ca_hierarchy: certificateOk, service_certificates: certificateOk, client_certificates: certificateOk });
  const secret_vault = nested({ vault_id: vaultOk ? "vault:w1.7b:platform-secrets" : "", vault_operational: vaultOk, secret_versioning: vaultOk, secret_policies: vaultOk, secret_encryption: vaultOk, secret_retrieval: vaultOk, secret_auditing: vaultOk, secret_lineage: vaultOk });
  const encryption_at_rest = nested({ policy_id: restOk ? "policy:w1.7b:encryption-at-rest" : "", database_encryption: restOk, object_encryption: restOk, ledger_encryption: restOk, backup_encryption: restOk, snapshot_encryption: restOk, storage_encryption_policies: restOk });
  const encryption_in_transit = nested({ policy_id: transitOk ? "policy:w1.7b:encryption-in-transit" : "", tls_configuration: transitOk, mutual_tls: transitOk, service_authentication: transitOk, certificate_validation: transitOk, secure_apis: transitOk, secure_messaging: transitOk, secure_replication: transitOk });
  const rotation = nested({ scheduler_id: rotationOk ? "scheduler:w1.7b:rotation" : "", automatic_key_rotation: rotationOk, certificate_rotation: rotationOk, secret_rotation: rotationOk, rotation_scheduling: rotationOk, rotation_validation: rotationOk, rotation_auditing: rotationOk });
  const revocation = nested({ registry_id: revocationOk ? "registry:w1.7b:revocation" : "", key_revocation: revocationOk, certificate_revocation: revocationOk, secret_invalidation: revocationOk, revocation_propagation: revocationOk, dependency_notification: revocationOk, recovery_procedures: revocationOk });
  const service_communication = nested({ framework_id: communicationOk ? "framework:w1.7b:secure-service-communication" : "", service_identity_validation: communicationOk, mutual_authentication: communicationOk, secure_messaging: communicationOk, secure_apis: communicationOk, service_authorization: communicationOk, communication_auditing: communicationOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.7b:security-evidence" : "", records: evidenceOk ? freezeArray(["security:key-lifecycle", "security:certificate", "security:vault", "security:encryption", "security:rotation", "security:revocation", "security:communication", "security:qualification"]) : freezeArray<string>([]), key_lifecycle_evidence: evidenceOk, certificate_evidence: evidenceOk, vault_evidence: evidenceOk, encryption_evidence: evidenceOk, rotation_reports: evidenceOk, revocation_reports: evidenceOk, communication_evidence: evidenceOk, qualification_reports: evidenceOk, immutable: evidenceOk, reproducible: evidenceOk });
  const qualification = nested({ report_id: gateOk ? "report:w1.7b:security-infrastructure-gate" : "", key_lifecycle_validation: qualified, certificate_validation: qualified, vault_validation: qualified, encryption_validation: qualified, rotation_validation: qualified, revocation_validation: qualified, communication_security_validation: qualified, tenant_isolation_validation: qualified, audit_validation: qualified, evidence_completeness: qualified, gate_decision: decision });
  const readiness = nested({ readiness_id: "W1.7B-SECURITY-FULL-READINESS-001", decision, phase_ready: qualified, identity_full_ready: identityOk, storage_full_ready: storageOk, messaging_full_ready: messagingOk, registry_full_ready: registryOk, configuration_platform_ready: configurationOk, observability_platform_ready: observabilityOk, security_core_ready: securityCoreOk, key_lifecycle_ready: keyOk, certificate_lifecycle_ready: certificateOk, secret_vault_ready: vaultOk, encryption_at_rest_ready: restOk, encryption_in_transit_ready: transitOk, rotation_ready: rotationOk, revocation_ready: revocationOk, communication_ready: communicationOk, evidence_ready: evidenceOk, qualification_ready: qualified && tenantOk && findingsOk, failures });
  const base: Omit<SecurityFullResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, identity_full_ref: "identity-full/w1.1b", storage_full_ref: "storage-full/w1.2b", messaging_full_ref: "messaging-full/w1.3b", registry_full_ref: "registry-full/w1.4b", configuration_platform_ref: "configuration-platform/w1.5", observability_platform_ref: "observability-platform/w1.6", security_core_ref: "security-core/w1.7a", key_lifecycle, certificate_lifecycle, secret_vault, encryption_at_rest, encryption_in_transit, rotation, revocation, service_communication, evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSecurityFull(result?: SecurityFullResult): SecurityFullValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, key_lifecycle_valid: false, certificate_lifecycle_valid: false, secret_vault_valid: false, encryption_at_rest_valid: false, encryption_in_transit_valid: false, rotation_valid: false, revocation_valid: false, communication_valid: false, evidence_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["PRODUCTION_KEY_LIFECYCLE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const key_lifecycle_valid = verifyHashed(result.key_lifecycle) && result.key_lifecycle.key_hierarchy && result.key_lifecycle.key_destruction && result.key_lifecycle.key_lineage;
  const certificate_lifecycle_valid = verifyHashed(result.certificate_lifecycle) && result.certificate_lifecycle.renewal && result.certificate_lifecycle.revocation && result.certificate_lifecycle.trust_chains;
  const secret_vault_valid = verifyHashed(result.secret_vault) && result.secret_vault.vault_operational && result.secret_vault.secret_versioning && result.secret_vault.secret_auditing;
  const encryption_at_rest_valid = verifyHashed(result.encryption_at_rest) && result.encryption_at_rest.database_encryption && result.encryption_at_rest.backup_encryption;
  const encryption_in_transit_valid = verifyHashed(result.encryption_in_transit) && result.encryption_in_transit.tls_configuration && result.encryption_in_transit.mutual_tls && result.encryption_in_transit.secure_messaging;
  const rotation_valid = verifyHashed(result.rotation) && result.rotation.automatic_key_rotation && result.rotation.certificate_rotation && result.rotation.rotation_validation;
  const revocation_valid = verifyHashed(result.revocation) && result.revocation.key_revocation && result.revocation.certificate_revocation && result.revocation.revocation_propagation;
  const communication_valid = verifyHashed(result.service_communication) && result.service_communication.service_identity_validation && result.service_communication.mutual_authentication && result.service_communication.service_authorization;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.reproducible;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.key_lifecycle_validation && result.qualification.tenant_isolation_validation && result.qualification.gate_decision === "QUALIFIED";
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && key_lifecycle_valid && certificate_lifecycle_valid && secret_vault_valid && encryption_at_rest_valid && encryption_in_transit_valid && rotation_valid && revocation_valid && communication_valid && evidence_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, key_lifecycle_valid, certificate_lifecycle_valid, secret_vault_valid, encryption_at_rest_valid, encryption_in_transit_valid, rotation_valid, revocation_valid, communication_valid, evidence_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replaySecurityFull(result = runSecurityFull()): boolean { const replayed = runSecurityFull(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSecurityFull(result).valid; }
export function getSecurityFullBundle(): SecurityFullBundle { const result = runSecurityFull(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_production_key_lifecycle: true, owns_certificate_lifecycle: true, owns_secret_vault: true, owns_encryption_at_rest: true, owns_encryption_in_transit: true, owns_automatic_rotation: true, owns_revocation: true, owns_secure_service_communication: true, owns_security_evidence: true, qualification_gate: "Security Infrastructure Gate" }), result, validation: validateSecurityFull(result) }); }
export const SecurityFullService = Object.freeze({ run: runSecurityFull, validate: validateSecurityFull, replay: replaySecurityFull });
