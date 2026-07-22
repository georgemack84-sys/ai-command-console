import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import { runMessagingFull, validateMessagingFull } from "@/services/messaging-full";
import { runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import { runStorageFull, validateStorageFull } from "@/services/storage-full";
import type { RegistryFullBundle, RegistryFullDecision, RegistryFullFailure, RegistryFullInput, RegistryFullResult, RegistryFullScenario, RegistryFullValidation } from "@/types/registry-full";

const VERSION = "registry-full/w1.4b" as const;
const IDENTIFIER = "RegistryFull" as const;
let identityBaseline: ReturnType<typeof runIdentityFull> | undefined;
let storageBaseline: ReturnType<typeof runStorageFull> | undefined;
let messagingBaseline: ReturnType<typeof runMessagingFull> | undefined;
let registryCoreBaseline: ReturnType<typeof runRegistryCore> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly RegistryFullFailure[], failure: RegistryFullFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: RegistryFullScenario): RegistryFullFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly RegistryFullFailure[], scenario: RegistryFullScenario): RegistryFullDecision {
  if (has(failures, "W1_1B_IDENTITY_FULL_INVALID") || has(failures, "W1_2B_STORAGE_FULL_INVALID") || has(failures, "W1_3B_MESSAGING_FULL_INVALID") || has(failures, "W1_4A_REGISTRY_CORE_INVALID") || has(failures, "SECURITY_FULL_INVALID") || has(failures, "SEARCH_NON_DETERMINISTIC") || has(failures, "INCOMPATIBLE_DEPLOYMENT_ALLOWED") || has(failures, "LINEAGE_NOT_REPLAYABLE") || has(failures, "INVALID_CONTRACT_ALLOWED") || has(failures, "GOVERNANCE_AUTHORITY_VALIDATION_FAILED") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "AUDIT_INTEGRITY_FAILED") || has(failures, "QUALIFICATION_EVIDENCE_NOT_IMMUTABLE")) return "FAIL_CLOSED";
  if (has(failures, "REGISTRY_INFRASTRUCTURE_GATE_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "QUALIFIED";
}
function resultReplayHash(result: Omit<RegistryFullResult, "replay_hash" | "integrity_hash">): string { return hash({ explorer: result.explorer.integrity_hash, search: result.search.integrity_hash, dependency: result.dependency_intelligence.integrity_hash, compatibility: result.compatibility.integrity_hash, lineage: result.lineage.integrity_hash, lifecycle: result.lifecycle_governance.integrity_hash, contracts: result.contract_validation.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<RegistryFullResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runRegistryFull(input: RegistryFullInput = {}): RegistryFullResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<RegistryFullFailure>(direct ? [direct] : []);
  identityBaseline ??= runIdentityFull();
  storageBaseline ??= runStorageFull();
  messagingBaseline ??= runMessagingFull();
  registryCoreBaseline ??= runRegistryCore();
  const identityInvalid = !validateIdentityFull(identityBaseline).valid || has(scenarioFailures, "W1_1B_IDENTITY_FULL_INVALID");
  const storageInvalid = !validateStorageFull(storageBaseline).valid || has(scenarioFailures, "W1_2B_STORAGE_FULL_INVALID");
  const messagingInvalid = !validateMessagingFull(messagingBaseline).valid || has(scenarioFailures, "W1_3B_MESSAGING_FULL_INVALID");
  const registryCoreInvalid = !validateRegistryCore(registryCoreBaseline).valid || has(scenarioFailures, "W1_4A_REGISTRY_CORE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(identityInvalid ? ["W1_1B_IDENTITY_FULL_INVALID" as const] : []), ...(storageInvalid ? ["W1_2B_STORAGE_FULL_INVALID" as const] : []), ...(messagingInvalid ? ["W1_3B_MESSAGING_FULL_INVALID" as const] : []), ...(registryCoreInvalid ? ["W1_4A_REGISTRY_CORE_INVALID" as const] : [])])]);
  const identityOk = !identityInvalid;
  const storageOk = !storageInvalid;
  const messagingOk = !messagingInvalid;
  const registryCoreOk = !registryCoreInvalid;
  const configurationOk = !has(failures, "CONFIGURATION_PLATFORM_INVALID");
  const observabilityOk = !has(failures, "OBSERVABILITY_PLATFORM_INVALID");
  const securityOk = !has(failures, "SECURITY_FULL_INVALID") && !has(failures, "GOVERNANCE_AUTHORITY_VALIDATION_FAILED") && !has(failures, "TENANT_ISOLATION_FAILED");
  const explorerOk = !has(failures, "REGISTRY_EXPLORER_MISSING") && !has(failures, "EXPLORER_NON_DETERMINISTIC") && !has(failures, "RELATIONSHIP_GRAPH_INCOMPLETE");
  const searchOk = !has(failures, "REGISTRY_SEARCH_MISSING") && !has(failures, "SEARCH_INDEX_INCOMPLETE") && !has(failures, "SEARCH_NON_DETERMINISTIC");
  const dependencyOk = !has(failures, "DEPENDENCY_ENGINE_MISSING") && !has(failures, "DEPENDENCY_GRAPH_INCOMPLETE") && !has(failures, "MISSING_DEPENDENCIES_UNDETECTED") && !has(failures, "CIRCULAR_DEPENDENCIES_UNDETECTED") && !has(failures, "DEPENDENCY_AUTHORITY_VIOLATION_UNDETECTED");
  const compatibilityOk = !has(failures, "COMPATIBILITY_ENGINE_MISSING") && !has(failures, "COMPATIBILITY_EVALUATION_NON_DETERMINISTIC") && !has(failures, "INCOMPATIBLE_DEPLOYMENT_ALLOWED");
  const lineageOk = !has(failures, "REGISTRY_LINEAGE_MISSING") && !has(failures, "LINEAGE_INCOMPLETE") && !has(failures, "LINEAGE_NOT_REPLAYABLE");
  const lifecycleOk = !has(failures, "LIFECYCLE_GOVERNANCE_MISSING") && !has(failures, "LIFECYCLE_APPROVAL_NOT_ENFORCED") && !has(failures, "LIFECYCLE_NON_DETERMINISTIC");
  const contractOk = !has(failures, "CONTRACT_VALIDATION_ENGINE_MISSING") && !has(failures, "INVALID_CONTRACT_ALLOWED") && !has(failures, "CONSTITUTIONAL_VALIDATION_MISSING");
  const evidenceOk = !has(failures, "QUALIFICATION_EVIDENCE_MISSING") && !has(failures, "QUALIFICATION_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "AUDIT_INTEGRITY_FAILED");
  const gateOk = !has(failures, "REGISTRY_INFRASTRUCTURE_GATE_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "QUALIFIED";
  const explorer = nested({ explorer_id: explorerOk ? `explorer:w1.4b:registry:${input.seed ?? "canonical"}` : "", hierarchical_browsing: explorerOk, namespace_traversal: explorerOk, ownership_visualization: explorerOk, capability_relationships: explorerOk, artifact_navigation: explorerOk, contract_browsing: explorerOk, relationship_graph: explorerOk, deterministic: explorerOk });
  const search = nested({ search_id: searchOk ? "search:w1.4b:registry" : "", indexed_registry: searchOk, metadata_search: searchOk, contract_search: searchOk, identity_search: searchOk, ownership_search: searchOk, tag_search: searchOk, version_lookup: searchOk, lifecycle_filtering: searchOk, deterministic_results: searchOk });
  const dependency_intelligence = nested({ engine_id: dependencyOk ? "engine:w1.4b:dependency-intelligence" : "", dependency_graph: dependencyOk, missing_detection: dependencyOk, cycle_detection: dependencyOk, version_validation: dependencyOk, ownership_validation: dependencyOk, contract_validation: dependencyOk, authority_validation: dependencyOk, impact_analysis: dependencyOk });
  const compatibility = nested({ engine_id: compatibilityOk ? "engine:w1.4b:compatibility" : "", compatibility_matrix: compatibilityOk, interface_compatibility: compatibilityOk, schema_compatibility: compatibilityOk, message_compatibility: compatibilityOk, version_compatibility: compatibilityOk, deployment_compatibility: compatibilityOk, policy_compatibility: compatibilityOk, deterministic_evaluation: compatibilityOk });
  const lineage = nested({ lineage_id: lineageOk ? "lineage:w1.4b:registry" : "", registrations: lineageOk, updates: lineageOk, approvals: lineageOk, ownership_changes: lineageOk, dependency_evolution: lineageOk, lifecycle_transitions: lineageOk, qualification_history: lineageOk, replayable: lineageOk, complete: lineageOk });
  const lifecycle_governance = nested({ governance_id: lifecycleOk ? "governance:w1.4b:lifecycle" : "", creation: lifecycleOk, approval: lifecycleOk, activation: lifecycleOk, modification: lifecycleOk, deprecation: lifecycleOk, retirement: lifecycleOk, archival: lifecycleOk, authority_enforcement: lifecycleOk, policy_validation: lifecycleOk, deterministic_workflows: lifecycleOk });
  const contract_validation = nested({ engine_id: contractOk ? "engine:w1.4b:contract-validation" : "", schema_correctness: contractOk, interface_consistency: contractOk, dependency_integrity: contractOk, policy_compliance: contractOk, semantic_validation: contractOk, authority_validation: contractOk, deterministic_behavior: contractOk, invalid_contract_rejection: contractOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.4b:registry-full-evidence" : "", records: evidenceOk ? freezeArray(["evidence:search", "evidence:dependency", "evidence:compatibility", "evidence:lineage", "evidence:governance", "evidence:contract-validation", "evidence:qualification"]) : freezeArray<string>([]), search_evidence: evidenceOk, dependency_evidence: evidenceOk, compatibility_evidence: evidenceOk, lineage_evidence: evidenceOk, governance_evidence: evidenceOk, validation_evidence: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const qualification = nested({ report_id: gateOk ? "report:w1.4b:registry-infrastructure-gate" : "", deterministic_queries: qualified, deterministic_validation: qualified, governance_enforcement: qualified, lifecycle_correctness: qualified, dependency_accuracy: qualified, compatibility_accuracy: qualified, lineage_completeness: qualified, evidence_integrity: qualified, tenant_isolation: qualified, gate_decision: decision });
  const readiness = nested({ readiness_id: "W1.4B-REGISTRY-FULL-READINESS-001", decision, phase_ready: qualified, identity_full_ready: identityOk, storage_full_ready: storageOk, messaging_full_ready: messagingOk, registry_core_ready: registryCoreOk, configuration_ready: configurationOk, observability_ready: observabilityOk, security_full_ready: securityOk, explorer_ready: explorerOk, search_ready: searchOk, dependency_ready: dependencyOk, compatibility_ready: compatibilityOk, lineage_ready: lineageOk, lifecycle_ready: lifecycleOk, contract_validation_ready: contractOk, evidence_ready: evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<RegistryFullResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, identity_full_ref: "identity-full/w1.1b", storage_full_ref: "storage-full/w1.2b", messaging_full_ref: "messaging-full/w1.3b", registry_core_ref: "registry-core/w1.4a", explorer, search, dependency_intelligence, compatibility, lineage, lifecycle_governance, contract_validation, evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateRegistryFull(result?: RegistryFullResult): RegistryFullValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, explorer_valid: false, search_valid: false, dependency_valid: false, compatibility_valid: false, lineage_valid: false, lifecycle_valid: false, contract_validation_valid: false, evidence_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["REGISTRY_EXPLORER_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const explorer_valid = verifyHashed(result.explorer) && result.explorer.hierarchical_browsing && result.explorer.relationship_graph && result.explorer.deterministic;
  const search_valid = verifyHashed(result.search) && result.search.indexed_registry && result.search.contract_search && result.search.deterministic_results;
  const dependency_valid = verifyHashed(result.dependency_intelligence) && result.dependency_intelligence.dependency_graph && result.dependency_intelligence.cycle_detection && result.dependency_intelligence.authority_validation;
  const compatibility_valid = verifyHashed(result.compatibility) && result.compatibility.compatibility_matrix && result.compatibility.schema_compatibility && result.compatibility.deterministic_evaluation;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.registrations && result.lineage.qualification_history && result.lineage.replayable && result.lineage.complete;
  const lifecycle_valid = verifyHashed(result.lifecycle_governance) && result.lifecycle_governance.approval && result.lifecycle_governance.archival && result.lifecycle_governance.authority_enforcement && result.lifecycle_governance.deterministic_workflows;
  const contract_validation_valid = verifyHashed(result.contract_validation) && result.contract_validation.schema_correctness && result.contract_validation.policy_compliance && result.contract_validation.invalid_contract_rejection;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 7 && result.evidence.immutable && result.evidence.replayable;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.deterministic_queries && result.qualification.governance_enforcement && result.qualification.gate_decision === "QUALIFIED";
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && explorer_valid && search_valid && dependency_valid && compatibility_valid && lineage_valid && lifecycle_valid && contract_validation_valid && evidence_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, explorer_valid, search_valid, dependency_valid, compatibility_valid, lineage_valid, lifecycle_valid, contract_validation_valid, evidence_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayRegistryFull(result = runRegistryFull()): boolean { const replayed = runRegistryFull(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateRegistryFull(result).valid; }
export function getRegistryFullBundle(): RegistryFullBundle { const result = runRegistryFull(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_registry_explorer: true, owns_registry_search: true, owns_dependency_intelligence: true, owns_compatibility_evaluation: true, owns_registry_lineage: true, owns_lifecycle_governance: true, owns_contract_validation: true, owns_registry_qualification: true, qualification_gate: "Registry Infrastructure Gate" }), result, validation: validateRegistryFull(result) }); }
export const RegistryFullService = Object.freeze({ run: runRegistryFull, validate: validateRegistryFull, replay: replayRegistryFull });
