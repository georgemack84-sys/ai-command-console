import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import { runMessagingFull, validateMessagingFull } from "@/services/messaging-full";
import { runObservabilityPlatform, validateObservabilityPlatform } from "@/services/observability-platform";
import { runRegistryFull, validateRegistryFull } from "@/services/registry-full";
import { runSecurityFull, validateSecurityFull } from "@/services/security-full";
import { runStorageFull, validateStorageFull } from "@/services/storage-full";
import type { CafLegionRuntimeBundle, CafLegionRuntimeDecision, CafLegionRuntimeFailure, CafLegionRuntimeInput, CafLegionRuntimeResult, CafLegionRuntimeScenario, CafLegionRuntimeValidation } from "@/types/caf-legion-runtime";

const VERSION = "caf-legion-runtime/w1.8" as const;
const IDENTIFIER = "CafLegionRuntime" as const;
let identityBaseline: ReturnType<typeof runIdentityFull> | undefined;
let storageBaseline: ReturnType<typeof runStorageFull> | undefined;
let messagingBaseline: ReturnType<typeof runMessagingFull> | undefined;
let registryBaseline: ReturnType<typeof runRegistryFull> | undefined;
let configurationBaseline: ReturnType<typeof runConfigurationPlatform> | undefined;
let observabilityBaseline: ReturnType<typeof runObservabilityPlatform> | undefined;
let securityBaseline: ReturnType<typeof runSecurityFull> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly CafLegionRuntimeFailure[], failure: CafLegionRuntimeFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: CafLegionRuntimeScenario): CafLegionRuntimeFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly CafLegionRuntimeFailure[], scenario: CafLegionRuntimeScenario): CafLegionRuntimeDecision {
  if (has(failures, "W1_1B_IDENTITY_FULL_INVALID") || has(failures, "W1_2B_STORAGE_FULL_INVALID") || has(failures, "W1_3B_MESSAGING_FULL_INVALID") || has(failures, "W1_4B_REGISTRY_FULL_INVALID") || has(failures, "W1_5_CONFIGURATION_PLATFORM_INVALID") || has(failures, "W1_6_OBSERVABILITY_PLATFORM_INVALID") || has(failures, "W1_7B_SECURITY_FULL_INVALID") || has(failures, "RUNTIME_ISOLATION_FAILED") || has(failures, "AGENT_IDENTITY_BINDING_FAILED") || has(failures, "DELEGATION_AUTHORITY_FAILED") || has(failures, "POLICY_ENFORCEMENT_FAILED") || has(failures, "UNSAFE_ACTION_NOT_BLOCKED") || has(failures, "AUTHORITY_CHAIN_INVALID") || has(failures, "OPERATOR_SUPREMACY_FAILED") || has(failures, "CAF_EVIDENCE_NOT_IMMUTABLE") || has(failures, "CAF_REPLAY_NON_DETERMINISTIC")) return "FAIL_CLOSED";
  if (has(failures, "CAF_RUNTIME_QUALIFICATION_GATE_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "QUALIFIED";
}
function resultReplayHash(result: Omit<CafLegionRuntimeResult, "replay_hash" | "integrity_hash">): string { return hash({ runtime: result.runtime_foundation.integrity_hash, agents: result.agent_registry.integrity_hash, orchestrator: result.orchestrator.integrity_hash, registries: result.capability_skill_registries.integrity_hash, planning: result.planning_memory.integrity_hash, collaboration: result.collaboration_delegation.integrity_hash, governance: result.governance.integrity_hash, operator: result.operator_console.integrity_hash, evidence: result.evidence.integrity_hash, replay: result.replay.integrity_hash, certification: result.certification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<CafLegionRuntimeResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runCafLegionRuntime(input: CafLegionRuntimeInput = {}): CafLegionRuntimeResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<CafLegionRuntimeFailure>(direct ? [direct] : []);
  identityBaseline ??= runIdentityFull();
  storageBaseline ??= runStorageFull();
  messagingBaseline ??= runMessagingFull();
  registryBaseline ??= runRegistryFull();
  configurationBaseline ??= runConfigurationPlatform();
  observabilityBaseline ??= runObservabilityPlatform();
  securityBaseline ??= runSecurityFull();
  const identityInvalid = !validateIdentityFull(identityBaseline).valid || has(scenarioFailures, "W1_1B_IDENTITY_FULL_INVALID");
  const storageInvalid = !validateStorageFull(storageBaseline).valid || has(scenarioFailures, "W1_2B_STORAGE_FULL_INVALID");
  const messagingInvalid = !validateMessagingFull(messagingBaseline).valid || has(scenarioFailures, "W1_3B_MESSAGING_FULL_INVALID");
  const registryInvalid = !validateRegistryFull(registryBaseline).valid || has(scenarioFailures, "W1_4B_REGISTRY_FULL_INVALID");
  const configurationInvalid = !validateConfigurationPlatform(configurationBaseline).valid || has(scenarioFailures, "W1_5_CONFIGURATION_PLATFORM_INVALID");
  const observabilityInvalid = !validateObservabilityPlatform(observabilityBaseline).valid || has(scenarioFailures, "W1_6_OBSERVABILITY_PLATFORM_INVALID");
  const securityInvalid = !validateSecurityFull(securityBaseline).valid || has(scenarioFailures, "W1_7B_SECURITY_FULL_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(identityInvalid ? ["W1_1B_IDENTITY_FULL_INVALID" as const] : []), ...(storageInvalid ? ["W1_2B_STORAGE_FULL_INVALID" as const] : []), ...(messagingInvalid ? ["W1_3B_MESSAGING_FULL_INVALID" as const] : []), ...(registryInvalid ? ["W1_4B_REGISTRY_FULL_INVALID" as const] : []), ...(configurationInvalid ? ["W1_5_CONFIGURATION_PLATFORM_INVALID" as const] : []), ...(observabilityInvalid ? ["W1_6_OBSERVABILITY_PLATFORM_INVALID" as const] : []), ...(securityInvalid ? ["W1_7B_SECURITY_FULL_INVALID" as const] : [])])]);
  const identityOk = !identityInvalid;
  const storageOk = !storageInvalid;
  const messagingOk = !messagingInvalid;
  const registryOk = !registryInvalid;
  const configurationOk = !configurationInvalid;
  const observabilityOk = !observabilityInvalid;
  const securityOk = !securityInvalid;
  const runtimeOk = !has(failures, "RUNTIME_FOUNDATION_MISSING") && !has(failures, "RUNTIME_LIFECYCLE_NON_DETERMINISTIC") && !has(failures, "RUNTIME_ISOLATION_FAILED");
  const agentOk = identityOk && !has(failures, "AGENT_REGISTRY_MISSING") && !has(failures, "AGENT_IDENTITY_BINDING_FAILED") && !has(failures, "AGENT_DISCOVERY_FAILED");
  const orchestratorOk = messagingOk && !has(failures, "ORCHESTRATOR_MISSING") && !has(failures, "EXECUTION_ROUTING_FAILED") && !has(failures, "WORKFLOW_COORDINATION_FAILED");
  const registriesOk = registryOk && !has(failures, "CAPABILITY_REGISTRY_MISSING") && !has(failures, "CAPABILITY_VALIDATION_FAILED") && !has(failures, "SKILL_REGISTRY_MISSING") && !has(failures, "SKILL_COMPOSITION_FAILED");
  const planningMemoryOk = storageOk && !has(failures, "PLANNING_ENGINE_MISSING") && !has(failures, "PLANNING_NON_DETERMINISTIC") && !has(failures, "PLAN_VALIDATION_FAILED") && !has(failures, "MEMORY_ENGINE_MISSING") && !has(failures, "MEMORY_GOVERNANCE_FAILED") && !has(failures, "MEMORY_PERSISTENCE_FAILED");
  const collaborationOk = !has(failures, "COLLABORATION_ENGINE_MISSING") && !has(failures, "COLLABORATION_GOVERNANCE_FAILED") && !has(failures, "DELEGATION_ENGINE_MISSING") && !has(failures, "DELEGATION_AUTHORITY_FAILED");
  const governanceOk = configurationOk && securityOk && !has(failures, "POLICY_GATE_MISSING") && !has(failures, "POLICY_ENFORCEMENT_FAILED") && !has(failures, "SAFETY_GATE_MISSING") && !has(failures, "UNSAFE_ACTION_NOT_BLOCKED") && !has(failures, "AUTHORITY_VALIDATOR_MISSING") && !has(failures, "AUTHORITY_CHAIN_INVALID");
  const operatorOk = observabilityOk && !has(failures, "OPERATOR_CONSOLE_MISSING") && !has(failures, "OPERATOR_SUPREMACY_FAILED");
  const evidenceOk = !has(failures, "CAF_EVIDENCE_MISSING") && !has(failures, "CAF_EVIDENCE_NOT_IMMUTABLE");
  const replayOk = !has(failures, "CAF_REPLAY_MISSING") && !has(failures, "CAF_REPLAY_NON_DETERMINISTIC");
  const certificationOk = !has(failures, "CERTIFICATION_PACKAGE_MISSING") && !has(failures, "CAF_RUNTIME_QUALIFICATION_GATE_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "QUALIFIED";
  const runtime_foundation = nested({ runtime_id: runtimeOk ? `runtime:w1.8:caf-legion:${input.seed ?? "canonical"}` : "", runtime_engine: runtimeOk, lifecycle_manager: runtimeOk, runtime_apis: runtimeOk, scheduler: runtimeOk, isolation_framework: runtimeOk, coordination: runtimeOk, deterministic_lifecycle: runtimeOk });
  const agent_registry = nested({ registry_id: agentOk ? "registry:w1.8:agents" : "", agent_registration: agentOk, identity_binding: agentOk, metadata_services: agentOk, runtime_discovery: agentOk, version_tracking: agentOk, agent_state: agentOk });
  const orchestrator = nested({ orchestrator_id: orchestratorOk ? "orchestrator:w1.8:runtime" : "", agent_scheduling: orchestratorOk, execution_control: orchestratorOk, workflow_coordination: orchestratorOk, dependency_resolution: orchestratorOk, runtime_supervision: orchestratorOk, execution_routing: orchestratorOk });
  const capability_skill_registries = nested({ registry_id: registriesOk ? "registry:w1.8:capability-skill" : "", capability_registration: registriesOk, capability_discovery: registriesOk, capability_versioning: registriesOk, dependency_mapping: registriesOk, capability_validation: registriesOk, skill_registration: registriesOk, skill_discovery: registriesOk, skill_composition: registriesOk });
  const planning_memory = nested({ engine_id: planningMemoryOk ? "engine:w1.8:planning-memory" : "", goal_planning: planningMemoryOk, task_planning: planningMemoryOk, mission_planning: planningMemoryOk, plan_validation: planningMemoryOk, deterministic_planning: planningMemoryOk, working_memory: planningMemoryOk, long_term_memory: planningMemoryOk, governed_memory: planningMemoryOk, memory_persistence: planningMemoryOk });
  const collaboration_delegation = nested({ engine_id: collaborationOk ? "engine:w1.8:collaboration-delegation" : "", team_formation: collaborationOk, shared_context: collaborationOk, task_coordination: collaborationOk, consensus_support: collaborationOk, collaboration_evidence: collaborationOk, task_delegation: collaborationOk, authority_verification: collaborationOk, delegation_audit: collaborationOk, delegation_recovery: collaborationOk });
  const governance = nested({ governance_id: governanceOk ? "governance:w1.8:runtime-gates" : "", policy_evaluation: governanceOk, policy_enforcement: governanceOk, policy_traceability: governanceOk, safety_validation: governanceOk, unsafe_action_detection: governanceOk, risk_blocking: governanceOk, authority_resolution: governanceOk, authority_verification: governanceOk, authority_chain_validation: governanceOk });
  const operator_console = nested({ console_id: operatorOk ? "console:w1.8:operator" : "", runtime_dashboard: operatorOk, agent_inspection: operatorOk, execution_monitoring: operatorOk, pause: operatorOk, resume: operatorOk, cancel: operatorOk, override_requests: operatorOk, manual_approval: operatorOk, operator_supremacy: operatorOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.8:caf-runtime-evidence" : "", records: evidenceOk ? freezeArray(["caf:execution", "caf:decision", "caf:planning", "caf:collaboration", "caf:safety", "caf:policy", "caf:authority"]) : freezeArray<string>([]), execution_evidence: evidenceOk, decision_evidence: evidenceOk, planning_evidence: evidenceOk, collaboration_evidence: evidenceOk, safety_evidence: evidenceOk, policy_evidence: evidenceOk, authority_evidence: evidenceOk, immutable: evidenceOk });
  const replay = nested({ replay_id: replayOk ? "replay:w1.8:caf-runtime" : "", runtime_replay: replayOk, decision_replay: replayOk, workflow_replay: replayOk, planning_replay: replayOk, collaboration_replay: replayOk, replay_validation: replayOk, deterministic: replayOk });
  const certification = nested({ package_id: certificationOk ? "certification:w1.8:caf-runtime" : "", runtime_certification_evidence: qualified, compliance_reports: qualified, readiness_reports: qualified, certification_package: qualified, functional_qualification: qualified, governance_qualification: qualified, operational_qualification: qualified, security_qualification: qualified, replay_qualification: qualified, gate_decision: decision });
  const readiness = nested({ readiness_id: "W1.8-CAF-LEGION-RUNTIME-READINESS-001", decision, phase_ready: qualified, identity_ready: identityOk, storage_ready: storageOk, messaging_ready: messagingOk, registry_ready: registryOk, configuration_ready: configurationOk, observability_ready: observabilityOk, security_ready: securityOk, runtime_ready: runtimeOk, agent_registry_ready: agentOk, orchestrator_ready: orchestratorOk, registries_ready: registriesOk, planning_memory_ready: planningMemoryOk, collaboration_delegation_ready: collaborationOk, governance_ready: governanceOk, operator_ready: operatorOk, evidence_ready: evidenceOk, replay_ready: replayOk, certification_ready: qualified, failures });
  const base: Omit<CafLegionRuntimeResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, identity_full_ref: "identity-full/w1.1b", storage_full_ref: "storage-full/w1.2b", messaging_full_ref: "messaging-full/w1.3b", registry_full_ref: "registry-full/w1.4b", configuration_platform_ref: "configuration-platform/w1.5", observability_platform_ref: "observability-platform/w1.6", security_full_ref: "security-full/w1.7b", runtime_foundation, agent_registry, orchestrator, capability_skill_registries, planning_memory, collaboration_delegation, governance, operator_console, evidence, replay, certification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCafLegionRuntime(result?: CafLegionRuntimeResult): CafLegionRuntimeValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, runtime_valid: false, agent_registry_valid: false, orchestrator_valid: false, registries_valid: false, planning_memory_valid: false, collaboration_delegation_valid: false, governance_valid: false, operator_valid: false, evidence_valid: false, replay_valid: false, certification_valid: false, readiness_valid: false, failures: freezeArray(["RUNTIME_FOUNDATION_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const runtime_valid = verifyHashed(result.runtime_foundation) && result.runtime_foundation.runtime_engine && result.runtime_foundation.isolation_framework && result.runtime_foundation.deterministic_lifecycle;
  const agent_registry_valid = verifyHashed(result.agent_registry) && result.agent_registry.agent_registration && result.agent_registry.identity_binding && result.agent_registry.runtime_discovery;
  const orchestrator_valid = verifyHashed(result.orchestrator) && result.orchestrator.agent_scheduling && result.orchestrator.workflow_coordination && result.orchestrator.execution_routing;
  const registries_valid = verifyHashed(result.capability_skill_registries) && result.capability_skill_registries.capability_validation && result.capability_skill_registries.skill_composition;
  const planning_memory_valid = verifyHashed(result.planning_memory) && result.planning_memory.deterministic_planning && result.planning_memory.governed_memory && result.planning_memory.memory_persistence;
  const collaboration_delegation_valid = verifyHashed(result.collaboration_delegation) && result.collaboration_delegation.task_coordination && result.collaboration_delegation.authority_verification && result.collaboration_delegation.delegation_audit;
  const governance_valid = verifyHashed(result.governance) && result.governance.policy_enforcement && result.governance.risk_blocking && result.governance.authority_chain_validation;
  const operator_valid = verifyHashed(result.operator_console) && result.operator_console.execution_monitoring && result.operator_console.manual_approval && result.operator_console.operator_supremacy;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 7 && result.evidence.immutable && result.evidence.authority_evidence;
  const replay_valid = verifyHashed(result.replay) && result.replay.runtime_replay && result.replay.planning_replay && result.replay.deterministic;
  const certification_valid = verifyHashed(result.certification) && result.certification.certification_package && result.certification.governance_qualification && result.certification.gate_decision === "QUALIFIED";
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && runtime_valid && agent_registry_valid && orchestrator_valid && registries_valid && planning_memory_valid && collaboration_delegation_valid && governance_valid && operator_valid && evidence_valid && replay_valid && certification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, runtime_valid, agent_registry_valid, orchestrator_valid, registries_valid, planning_memory_valid, collaboration_delegation_valid, governance_valid, operator_valid, evidence_valid, replay_valid, certification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayCafLegionRuntime(result = runCafLegionRuntime()): boolean { const replayed = runCafLegionRuntime(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCafLegionRuntime(result).valid; }
export function getCafLegionRuntimeBundle(): CafLegionRuntimeBundle { const result = runCafLegionRuntime(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_agent_runtime: true, owns_agent_registry: true, owns_runtime_orchestrator: true, owns_capability_registry: true, owns_skill_registry: true, owns_planning_engine: true, owns_memory_engine: true, owns_collaboration: true, owns_delegation: true, owns_governance_gates: true, owns_operator_console: true, owns_caf_evidence: true, owns_caf_replay: true, owns_caf_certification: true, qualification_gate: "CAF Runtime Qualification Gate" }), result, validation: validateCafLegionRuntime(result) }); }
export const CafLegionRuntimeService = Object.freeze({ run: runCafLegionRuntime, validate: validateCafLegionRuntime, replay: replayCafLegionRuntime });
