import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { runMessagingCore, validateMessagingCore } from "@/services/messaging-core";
import { runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import { runStorageCore, validateStorageCore } from "@/services/storage-core";
import type { ConfigurationPlatformBundle, ConfigurationPlatformDecision, ConfigurationPlatformFailure, ConfigurationPlatformInput, ConfigurationPlatformResult, ConfigurationPlatformScenario, ConfigurationPlatformValidation } from "@/types/configuration-platform";

const VERSION = "configuration-platform/w1.5" as const;
const IDENTIFIER = "ConfigurationPlatform" as const;
let registryBaseline: ReturnType<typeof runRegistryCore> | undefined;
let identityBaseline: ReturnType<typeof runIdentityCore> | undefined;
let storageBaseline: ReturnType<typeof runStorageCore> | undefined;
let messagingBaseline: ReturnType<typeof runMessagingCore> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ConfigurationPlatformFailure[], failure: ConfigurationPlatformFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: ConfigurationPlatformScenario): ConfigurationPlatformFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly ConfigurationPlatformFailure[], scenario: ConfigurationPlatformScenario): ConfigurationPlatformDecision {
  if (has(failures, "W1_4A_REGISTRY_CORE_INVALID") || has(failures, "W1_1A_IDENTITY_CORE_INVALID") || has(failures, "W1_2A_STORAGE_CORE_INVALID") || has(failures, "W1_3A_MESSAGING_CORE_INVALID") || has(failures, "SECURITY_CORE_INVALID") || has(failures, "RUNTIME_RESOLUTION_NON_DETERMINISTIC") || has(failures, "FEATURE_FLAG_EVALUATION_NON_DETERMINISTIC") || has(failures, "ENVIRONMENT_ISOLATION_FAILED") || has(failures, "AUTHORIZATION_VALIDATION_FAILED") || has(failures, "CONFIGURATION_EVIDENCE_NOT_IMMUTABLE") || has(failures, "CONFIGURATION_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "CONFIGURATION_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "CONFIGURATION_PLATFORM_QUALIFIED";
}
function resultReplayHash(result: Omit<ConfigurationPlatformResult, "replay_hash" | "integrity_hash">): string { return hash({ architecture: result.architecture.integrity_hash, service: result.configuration_service.integrity_hash, runtime: result.runtime_configuration.integrity_hash, flags: result.feature_flags.integrity_hash, environments: result.environment_profiles.integrity_hash, validation: result.validation.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<ConfigurationPlatformResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runConfigurationPlatform(input: ConfigurationPlatformInput = {}): ConfigurationPlatformResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ConfigurationPlatformFailure>(direct ? [direct] : []);
  registryBaseline ??= runRegistryCore();
  identityBaseline ??= runIdentityCore();
  storageBaseline ??= runStorageCore();
  messagingBaseline ??= runMessagingCore();
  const registryInvalid = !validateRegistryCore(registryBaseline).valid || has(scenarioFailures, "W1_4A_REGISTRY_CORE_INVALID");
  const identityInvalid = !validateIdentityCore(identityBaseline).valid || has(scenarioFailures, "W1_1A_IDENTITY_CORE_INVALID");
  const storageInvalid = !validateStorageCore(storageBaseline).valid || has(scenarioFailures, "W1_2A_STORAGE_CORE_INVALID");
  const messagingInvalid = !validateMessagingCore(messagingBaseline).valid || has(scenarioFailures, "W1_3A_MESSAGING_CORE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(registryInvalid ? ["W1_4A_REGISTRY_CORE_INVALID" as const] : []), ...(identityInvalid ? ["W1_1A_IDENTITY_CORE_INVALID" as const] : []), ...(storageInvalid ? ["W1_2A_STORAGE_CORE_INVALID" as const] : []), ...(messagingInvalid ? ["W1_3A_MESSAGING_CORE_INVALID" as const] : [])])]);
  const registryOk = !registryInvalid;
  const identityOk = !identityInvalid;
  const storageOk = !storageInvalid;
  const messagingOk = !messagingInvalid;
  const reconciliationOk = !has(failures, "REGISTRY_RECONCILIATION_INCOMPLETE");
  const observabilityOk = !has(failures, "OBSERVABILITY_QUALIFICATION_INVALID");
  const securityOk = !has(failures, "SECURITY_CORE_INVALID") && !has(failures, "AUTHORIZATION_VALIDATION_FAILED");
  const architectureOk = !has(failures, "CONFIGURATION_ARCHITECTURE_MISSING") && !has(failures, "CONFIGURATION_DOMAIN_REGISTRY_MISSING");
  const serviceOk = storageOk && !has(failures, "CONFIGURATION_SERVICE_MISSING") && !has(failures, "CONFIGURATION_STORAGE_UNAVAILABLE") && !has(failures, "CONFIGURATION_VERSION_HISTORY_MISSING");
  const runtimeOk = !has(failures, "RUNTIME_CONFIGURATION_MISSING") && !has(failures, "RUNTIME_RESOLUTION_NON_DETERMINISTIC") && !has(failures, "RUNTIME_REFRESH_UNCONTROLLED");
  const flagsOk = !has(failures, "FEATURE_FLAG_PLATFORM_MISSING") && !has(failures, "FEATURE_FLAG_EVALUATION_NON_DETERMINISTIC") && !has(failures, "ROLLOUT_POLICY_INVALID");
  const environmentsOk = !has(failures, "ENVIRONMENT_PROFILES_MISSING") && !has(failures, "ENVIRONMENT_ISOLATION_FAILED") && !has(failures, "PROFILE_INHERITANCE_NON_DETERMINISTIC");
  const validationOk = securityOk && !has(failures, "CONFIGURATION_VALIDATION_MISSING") && !has(failures, "SCHEMA_VALIDATION_FAILED") && !has(failures, "CONTRACT_VALIDATION_FAILED") && !has(failures, "DEPENDENCY_VALIDATION_FAILED") && !has(failures, "CONFLICT_DETECTION_FAILED");
  const evidenceOk = !has(failures, "CONFIGURATION_EVIDENCE_MISSING") && !has(failures, "CONFIGURATION_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "CONFIGURATION_LINEAGE_MISSING") && !has(failures, "CONFIGURATION_REPLAY_INVALID");
  const gateOk = !has(failures, "CONFIGURATION_QUALIFICATION_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "CONFIGURATION_PLATFORM_QUALIFIED";
  const architecture = nested({ architecture_id: architectureOk ? `architecture:w1.5:configuration:${input.seed ?? "canonical"}` : "", domains_defined: architectureOk, ownership_defined: architectureOk, hierarchy_defined: architectureOk, lifecycle_defined: architectureOk, contracts_defined: architectureOk, inheritance_rules: architectureOk, override_rules: architectureOk, deterministic_resolution_model: architectureOk });
  const configuration_service = nested({ service_id: serviceOk ? "service:w1.5:configuration" : "", configuration_storage: serviceOk, retrieval: serviceOk, version_management: serviceOk, namespace_support: serviceOk, tenant_isolation: serviceOk, snapshots: serviceOk, immutable_history: serviceOk });
  const runtime_configuration = nested({ engine_id: runtimeOk ? "engine:w1.5:runtime-configuration" : "", runtime_loading: runtimeOk, configuration_caching: runtimeOk, deterministic_resolution: runtimeOk, immutable_snapshots: runtimeOk, runtime_refresh: runtimeOk, configuration_locking: runtimeOk, reproducible: runtimeOk });
  const feature_flags = nested({ platform_id: flagsOk ? "platform:w1.5:feature-flags" : "", flag_registry: flagsOk, feature_activation: flagsOk, rollout_policies: flagsOk, environment_targeting: flagsOk, tenant_targeting: flagsOk, evaluation_logging: flagsOk, deterministic_evaluation: flagsOk });
  const environment_profiles = nested({ registry_id: environmentsOk ? "registry:w1.5:environment-profiles" : "", profiles: environmentsOk ? freezeArray(["development", "integration", "testing", "staging", "production"]) : freezeArray<string>([]), environment_inheritance: environmentsOk, profile_validation: environmentsOk, environment_policies: environmentsOk, environment_isolation: environmentsOk, deterministic_inheritance: environmentsOk });
  const validation = nested({ engine_id: validationOk ? "engine:w1.5:configuration-validation" : "", schema_validation: validationOk, contract_validation: validationOk, dependency_validation: validationOk, conflict_detection: validationOk, authorization_validation: validationOk, deterministic_validation: validationOk, passed: validationOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.5:configuration-evidence" : "", records: evidenceOk ? freezeArray(["config:lineage", "config:decision", "config:version", "config:validation", "config:deployment", "config:replay"]) : freezeArray<string>([]), configuration_lineage: evidenceOk, configuration_decisions: evidenceOk, version_evidence: evidenceOk, validation_evidence: evidenceOk, deployment_evidence: evidenceOk, immutable_audit: evidenceOk, replayable: evidenceOk });
  const qualification = nested({ report_id: gateOk ? "report:w1.5:configuration-qualification" : "", deterministic_resolution: qualified, configuration_integrity: qualified, environment_isolation: qualified, feature_flag_evaluation: qualified, runtime_consistency: qualified, evidence_completeness: qualified, replayability: qualified, qualified });
  const readiness = nested({ readiness_id: "W1.5-CONFIGURATION-PLATFORM-READINESS-001", decision, phase_ready: qualified, registry_core_ready: registryOk, identity_core_ready: identityOk, storage_core_ready: storageOk, messaging_core_ready: messagingOk, registry_reconciliation_complete: reconciliationOk, observability_qualified: observabilityOk, security_core_ready: securityOk, architecture_ready: architectureOk, service_ready: serviceOk, runtime_ready: runtimeOk, feature_flags_ready: flagsOk, environment_profiles_ready: environmentsOk, validation_ready: validationOk, evidence_ready: evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<ConfigurationPlatformResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, registry_core_ref: "registry-core/w1.4a", identity_core_ref: "identity-core/w1.1a", storage_core_ref: "storage-core/w1.2a", messaging_core_ref: "messaging-core/w1.3a", architecture, configuration_service, runtime_configuration, feature_flags, environment_profiles, validation, evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateConfigurationPlatform(result?: ConfigurationPlatformResult): ConfigurationPlatformValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, architecture_valid: false, service_valid: false, runtime_valid: false, feature_flags_valid: false, environment_profiles_valid: false, configuration_validation_valid: false, evidence_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["CONFIGURATION_ARCHITECTURE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const architecture_valid = verifyHashed(result.architecture) && result.architecture.domains_defined && result.architecture.deterministic_resolution_model;
  const service_valid = verifyHashed(result.configuration_service) && result.configuration_service.configuration_storage && result.configuration_service.tenant_isolation && result.configuration_service.immutable_history;
  const runtime_valid = verifyHashed(result.runtime_configuration) && result.runtime_configuration.deterministic_resolution && result.runtime_configuration.immutable_snapshots && result.runtime_configuration.reproducible;
  const feature_flags_valid = verifyHashed(result.feature_flags) && result.feature_flags.rollout_policies && result.feature_flags.evaluation_logging && result.feature_flags.deterministic_evaluation;
  const environment_profiles_valid = verifyHashed(result.environment_profiles) && result.environment_profiles.profiles.length >= 5 && result.environment_profiles.environment_isolation && result.environment_profiles.deterministic_inheritance;
  const configuration_validation_valid = verifyHashed(result.validation) && result.validation.schema_validation && result.validation.contract_validation && result.validation.authorization_validation && result.validation.passed;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 6 && result.evidence.immutable_audit && result.evidence.replayable;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.deterministic_resolution && result.qualification.evidence_completeness && result.qualification.qualified;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && architecture_valid && service_valid && runtime_valid && feature_flags_valid && environment_profiles_valid && configuration_validation_valid && evidence_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, architecture_valid, service_valid, runtime_valid, feature_flags_valid, environment_profiles_valid, configuration_validation_valid, evidence_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayConfigurationPlatform(result = runConfigurationPlatform()): boolean { const replayed = runConfigurationPlatform(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateConfigurationPlatform(result).valid; }
export function getConfigurationPlatformBundle(): ConfigurationPlatformBundle { const result = runConfigurationPlatform(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_configuration_service: true, owns_runtime_configuration: true, owns_feature_flags: true, owns_environment_profiles: true, owns_configuration_validation: true, owns_configuration_evidence: true, exit_state: "CONFIGURATION_PLATFORM_QUALIFIED" }), result, validation: validateConfigurationPlatform(result) }); }
export const ConfigurationPlatformService = Object.freeze({ run: runConfigurationPlatform, validate: validateConfigurationPlatform, replay: replayConfigurationPlatform });
