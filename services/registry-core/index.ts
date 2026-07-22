import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runIdentityCore, validateIdentityCore } from "@/services/identity-core";
import { runMessagingCore, validateMessagingCore } from "@/services/messaging-core";
import { runStorageCore, validateStorageCore } from "@/services/storage-core";
import type { RegistryCoreBundle, RegistryCoreDecision, RegistryCoreFailure, RegistryCoreInput, RegistryCoreResult, RegistryCoreScenario, RegistryCoreValidation } from "@/types/registry-core";

const VERSION = "registry-core/w1.4a" as const;
const IDENTIFIER = "RegistryCore" as const;
let identityBaseline: ReturnType<typeof runIdentityCore> | undefined;
let storageBaseline: ReturnType<typeof runStorageCore> | undefined;
let messagingBaseline: ReturnType<typeof runMessagingCore> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly RegistryCoreFailure[], failure: RegistryCoreFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: RegistryCoreScenario): RegistryCoreFailure | undefined { return scenario === "BASELINE" || scenario === "ACTIVE_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly RegistryCoreFailure[], scenario: RegistryCoreScenario): RegistryCoreDecision {
  if (has(failures, "W1_1A_IDENTITY_CORE_INVALID") || has(failures, "W1_2A_STORAGE_CORE_INVALID") || has(failures, "W1_3A_MESSAGING_CORE_INVALID") || has(failures, "SECURITY_CORE_INVALID") || has(failures, "QUERY_NON_DETERMINISTIC") || has(failures, "REGISTRY_AUTHORIZATION_FAILED") || has(failures, "REGISTRY_ACCESS_POLICY_VIOLATED") || has(failures, "REGISTRY_EVIDENCE_NOT_IMMUTABLE") || has(failures, "REGISTRY_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "CORE_ACTIVATION_FAILED")) return "NOT_ACTIVE";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP") return "CONDITIONALLY_ACTIVE";
  return scenario === "ACTIVE_WITH_OBSERVATIONS" ? "ACTIVE_WITH_OBSERVATIONS" : "CORE_ACTIVATED";
}
function resultReplayHash(result: Omit<RegistryCoreResult, "replay_hash" | "integrity_hash">): string { return hash({ architecture: result.architecture.integrity_hash, persistence: result.persistence.integrity_hash, registration: result.registration_engine.integrity_hash, query: result.query_engine.integrity_hash, ownership: result.ownership_registry.integrity_hash, dependency: result.dependency_registry.integrity_hash, contract: result.contract_registry.integrity_hash, messaging: result.registry_messaging.integrity_hash, security: result.security.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<RegistryCoreResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runRegistryCore(input: RegistryCoreInput = {}): RegistryCoreResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<RegistryCoreFailure>(direct ? [direct] : []);
  identityBaseline ??= runIdentityCore();
  storageBaseline ??= runStorageCore();
  messagingBaseline ??= runMessagingCore();
  const identityInvalid = !validateIdentityCore(identityBaseline).valid || has(scenarioFailures, "W1_1A_IDENTITY_CORE_INVALID");
  const storageInvalid = !validateStorageCore(storageBaseline).valid || has(scenarioFailures, "W1_2A_STORAGE_CORE_INVALID");
  const messagingInvalid = !validateMessagingCore(messagingBaseline).valid || has(scenarioFailures, "W1_3A_MESSAGING_CORE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(identityInvalid ? ["W1_1A_IDENTITY_CORE_INVALID" as const] : []), ...(storageInvalid ? ["W1_2A_STORAGE_CORE_INVALID" as const] : []), ...(messagingInvalid ? ["W1_3A_MESSAGING_CORE_INVALID" as const] : [])])]);
  const identityOk = !identityInvalid;
  const storageOk = !storageInvalid;
  const messagingOk = !messagingInvalid;
  const securityOk = !has(failures, "SECURITY_CORE_INVALID") && !has(failures, "REGISTRY_SECURITY_MISSING") && !has(failures, "REGISTRY_AUTHENTICATION_FAILED") && !has(failures, "REGISTRY_AUTHORIZATION_FAILED") && !has(failures, "REGISTRY_ACCESS_POLICY_VIOLATED");
  const architectureOk = !has(failures, "REGISTRY_ARCHITECTURE_MISSING") && !has(failures, "REGISTRY_DATA_MODEL_INVALID");
  const persistenceOk = storageOk && !has(failures, "REGISTRY_PERSISTENCE_MISSING") && !has(failures, "REGISTRY_STORAGE_UNAVAILABLE");
  const registrationOk = identityOk && securityOk && !has(failures, "REGISTRATION_ENGINE_MISSING") && !has(failures, "SERVICE_REGISTRATION_FAILED") && !has(failures, "CONTRACT_REGISTRATION_FAILED") && !has(failures, "DEPENDENCY_REGISTRATION_FAILED") && !has(failures, "OWNERSHIP_REGISTRATION_FAILED");
  const queryOk = !has(failures, "QUERY_ENGINE_MISSING") && !has(failures, "DETERMINISTIC_LOOKUP_FAILED") && !has(failures, "QUERY_NON_DETERMINISTIC");
  const ownershipOk = !has(failures, "OWNERSHIP_REGISTRY_MISSING") && !has(failures, "AUTHORITY_RECORDS_MISSING");
  const dependencyOk = !has(failures, "DEPENDENCY_REGISTRY_MISSING") && !has(failures, "DEPENDENCY_GRAPH_INVALID") && !has(failures, "DEPENDENCY_CYCLE_UNCONTROLLED");
  const contractOk = !has(failures, "CONTRACT_REGISTRY_MISSING") && !has(failures, "CONTRACT_VALIDATION_FAILED");
  const registryMessagingOk = messagingOk && !has(failures, "REGISTRY_MESSAGING_MISSING") && !has(failures, "REGISTRATION_EVENTS_NOT_PUBLISHED");
  const evidenceOk = !has(failures, "REGISTRY_EVIDENCE_MISSING") && !has(failures, "REGISTRY_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "REGISTRATION_LINEAGE_MISSING") && !has(failures, "REGISTRY_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const architecture = nested({ architecture_id: architectureOk ? `architecture:w1.4a:registry-core:${input.seed ?? "canonical"}` : "", data_model: architectureOk, registration_model: architectureOk, query_model: architectureOk, ownership_model: architectureOk, evidence_model: architectureOk, deterministic_discovery: architectureOk });
  const persistence = nested({ storage_id: persistenceOk ? "storage:w1.4a:registry" : "", registry_database: persistenceOk, indexes: persistenceOk, version_storage: persistenceOk, metadata_storage: persistenceOk, durable_state: persistenceOk, integrity_hashing: persistenceOk });
  const registration_engine = nested({ engine_id: registrationOk ? "engine:w1.4a:registration" : "", service_registration: registrationOk, contract_registration: registrationOk, dependency_registration: registrationOk, ownership_registration: registrationOk, validation_pipeline: registrationOk, removal_policies: registrationOk });
  const query_engine = nested({ engine_id: queryOk ? "engine:w1.4a:registry-query" : "", deterministic_lookup: queryOk, search_api: queryOk, lookup_api: queryOk, resolution_service: queryOk, query_optimization: queryOk, stable_sorting: queryOk });
  const ownership_registry = nested({ registry_id: ownershipOk ? "registry:w1.4a:ownership" : "", service_owners: ownershipOk, contract_owners: ownershipOk, component_owners: ownershipOk, namespace_owners: ownershipOk, tenant_owners: ownershipOk, authority_records: ownershipOk });
  const dependency_registry = nested({ registry_id: dependencyOk ? "registry:w1.4a:dependencies" : "", service_dependencies: dependencyOk, runtime_dependencies: dependencyOk, infrastructure_dependencies: dependencyOk, cross_core_dependencies: dependencyOk, dependency_graph: dependencyOk, dependency_lineage: dependencyOk, cycle_controls: dependencyOk });
  const contract_registry = nested({ registry_id: contractOk ? "registry:w1.4a:contracts" : "", service_contracts: contractOk, interface_contracts: contractOk, api_contracts: contractOk, platform_contracts: contractOk, version_registry: contractOk, contract_validation: contractOk });
  const registry_messaging = nested({ messaging_id: registryMessagingOk ? "messaging:w1.4a:registry-events" : "", command_transport: registryMessagingOk, event_transport: registryMessagingOk, service_registered_events: registryMessagingOk, contract_registered_events: registryMessagingOk, dependency_registered_events: registryMessagingOk, ownership_changed_events: registryMessagingOk, retry_and_dlq: registryMessagingOk });
  const security = nested({ security_id: securityOk ? "security:w1.4a:registry" : "", authentication: securityOk, authorization: securityOk, access_policies: securityOk, audit_controls: securityOk, cryptographic_validation: securityOk, certificate_validation: securityOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.4a:registry-evidence" : "", records: evidenceOk ? freezeArray(["registration:service", "registration:contract", "registration:dependency", "registration:ownership", "event:registry", "lineage:registry"]) : freezeArray<string>([]), registration_evidence: evidenceOk, audit_evidence: evidenceOk, lineage_records: evidenceOk, registration_history: evidenceOk, immutable: evidenceOk, replay_validated: evidenceOk });
  const readiness = nested({ readiness_id: "W1.4A-REGISTRY-CORE-READINESS-001", decision, phase_ready: decision === "CORE_ACTIVATED" || decision === "ACTIVE_WITH_OBSERVATIONS", identity_ready: identityOk, storage_ready: storageOk, messaging_ready: messagingOk, security_ready: securityOk, architecture_ready: architectureOk, persistence_ready: persistenceOk, registration_ready: registrationOk, query_ready: queryOk, ownership_ready: ownershipOk, dependency_ready: dependencyOk, contract_ready: contractOk, registry_messaging_ready: registryMessagingOk, evidence_ready: evidenceOk, failures });
  const base: Omit<RegistryCoreResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, identity_core_ref: "identity-core/w1.1a", storage_core_ref: "storage-core/w1.2a", messaging_core_ref: "messaging-core/w1.3a", architecture, persistence, registration_engine, query_engine, ownership_registry, dependency_registry, contract_registry, registry_messaging, security, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateRegistryCore(result?: RegistryCoreResult): RegistryCoreValidation {
  if (!result) return nested({ valid: false, decision: "NOT_ACTIVE" as const, replay_hash_valid: false, integrity_hash_valid: false, architecture_valid: false, persistence_valid: false, registration_valid: false, query_valid: false, ownership_valid: false, dependency_valid: false, contract_valid: false, messaging_valid: false, security_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["REGISTRY_ARCHITECTURE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const architecture_valid = verifyHashed(result.architecture) && result.architecture.data_model && result.architecture.deterministic_discovery;
  const persistence_valid = verifyHashed(result.persistence) && result.persistence.registry_database && result.persistence.durable_state && result.persistence.integrity_hashing;
  const registration_valid = verifyHashed(result.registration_engine) && result.registration_engine.service_registration && result.registration_engine.contract_registration && result.registration_engine.dependency_registration && result.registration_engine.ownership_registration;
  const query_valid = verifyHashed(result.query_engine) && result.query_engine.deterministic_lookup && result.query_engine.resolution_service && result.query_engine.stable_sorting;
  const ownership_valid = verifyHashed(result.ownership_registry) && result.ownership_registry.service_owners && result.ownership_registry.tenant_owners && result.ownership_registry.authority_records;
  const dependency_valid = verifyHashed(result.dependency_registry) && result.dependency_registry.dependency_graph && result.dependency_registry.dependency_lineage && result.dependency_registry.cycle_controls;
  const contract_valid = verifyHashed(result.contract_registry) && result.contract_registry.service_contracts && result.contract_registry.api_contracts && result.contract_registry.contract_validation;
  const messaging_valid = verifyHashed(result.registry_messaging) && result.registry_messaging.event_transport && result.registry_messaging.service_registered_events && result.registry_messaging.retry_and_dlq;
  const security_valid = verifyHashed(result.security) && result.security.authentication && result.security.authorization && result.security.access_policies && result.security.cryptographic_validation;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 6 && result.evidence.immutable && result.evidence.replay_validated;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && architecture_valid && persistence_valid && registration_valid && query_valid && ownership_valid && dependency_valid && contract_valid && messaging_valid && security_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, architecture_valid, persistence_valid, registration_valid, query_valid, ownership_valid, dependency_valid, contract_valid, messaging_valid, security_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayRegistryCore(result = runRegistryCore()): boolean { const scenario = result.readiness.decision === "ACTIVE_WITH_OBSERVATIONS" ? { scenario: "ACTIVE_WITH_OBSERVATIONS" as const } : {}; const replayed = runRegistryCore(scenario); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateRegistryCore(result).valid; }
export function getRegistryCoreBundle(): RegistryCoreBundle { const result = runRegistryCore(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_registry_engine: true, owns_service_registration: true, owns_contract_registration: true, owns_dependency_registration: true, owns_ownership_registry: true, owns_query_engine: true, owns_registry_messaging: true, owns_registry_evidence: true }), result, validation: validateRegistryCore(result) }); }
export const RegistryCoreService = Object.freeze({ run: runRegistryCore, validate: validateRegistryCore, replay: replayRegistryCore });
