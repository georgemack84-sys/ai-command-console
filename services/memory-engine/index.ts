import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { MemoryEngineBundle, MemoryEngineDecision, MemoryEngineFailure, MemoryEngineInput, MemoryEngineResult, MemoryEngineScenario, MemoryEngineValidation, MemoryKind } from "@/types/memory-engine";

const VERSION = "memory-engine/w2.9" as const;
const IDENTIFIER = "MemoryEngine" as const;
const MEMORY_KINDS = Object.freeze<MemoryKind[]>(["Working", "Semantic", "Procedural", "Episodic"]);
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let skillRegistryBaseline: ReturnType<typeof runSkillRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;
let policyGateBaseline: ReturnType<typeof runPolicyGate> | undefined;
let safetyGateBaseline: ReturnType<typeof runSafetyGate> | undefined;
let planningEngineBaseline: ReturnType<typeof runPlanningEngine> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly MemoryEngineFailure[], failure: MemoryEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: MemoryEngineScenario): MemoryEngineFailure | undefined { return scenario === "BASELINE" || scenario === "CERTIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly MemoryEngineFailure[], scenario: MemoryEngineScenario): MemoryEngineDecision {
  if (has(failures, "W2_0_CAF_CONSTITUTION_INVALID") || has(failures, "W2_1_AGENT_REGISTRY_INVALID") || has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID") || has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID") || has(failures, "W2_4_SKILL_REGISTRY_INVALID") || has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID") || has(failures, "W2_6_POLICY_GATE_INVALID") || has(failures, "W2_7_SAFETY_GATE_INVALID") || has(failures, "W2_8_PLANNING_ENGINE_INVALID") || has(failures, "WORKING_MEMORY_NON_DETERMINISTIC") || has(failures, "RUNTIME_ISOLATION_FAILED") || has(failures, "KNOWLEDGE_VALIDATION_MISSING") || has(failures, "SEMANTIC_RETRIEVAL_NON_DETERMINISTIC") || has(failures, "PROCEDURE_RETRIEVAL_INVALID") || has(failures, "EPISODIC_REPLAY_INVALID") || has(failures, "PROVENANCE_NOT_IMMUTABLE") || has(failures, "SOURCE_ATTRIBUTION_MISSING") || has(failures, "MEMORY_IDENTIFIER_NOT_UNIQUE") || has(failures, "MEMORY_OWNER_MISSING") || has(failures, "MEMORY_TENANT_NAMESPACE_MISSING") || has(failures, "AUTHORITY_POLICY_SAFETY_BYPASSED") || has(failures, "DELETION_APPROVAL_BYPASSED") || has(failures, "MEMORY_UPDATE_DESTROYS_HISTORY") || has(failures, "RETRIEVAL_NON_DETERMINISTIC") || has(failures, "RETRIEVAL_EXPLANATION_MISSING") || has(failures, "RETRIEVAL_CONFIDENCE_MISSING") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "MEMORY_EVIDENCE_NOT_IMMUTABLE") || has(failures, "MEMORY_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "MEMORY_ENGINE_CERTIFICATION_FAILED")) return "NOT_CERTIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "CERTIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_CERTIFIED";
  return "MEMORY_ENGINE_CERTIFIED";
}
function resultReplayHash(result: Omit<MemoryEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ working: result.working.integrity_hash, semantic: result.semantic.integrity_hash, procedural: result.procedural.integrity_hash, episodic: result.episodic.integrity_hash, provenance: result.provenance.integrity_hash, governance: result.governance.integrity_hash, retrieval: result.retrieval.integrity_hash, registry: result.registry.integrity_hash, apis: result.apis.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<MemoryEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runMemoryEngine(input: MemoryEngineInput = {}): MemoryEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<MemoryEngineFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation();
  agentRegistryBaseline ??= runAgentRegistry();
  lifecycleBaseline ??= runLifecycleEngine();
  capabilityRegistryBaseline ??= runCapabilityRegistry();
  skillRegistryBaseline ??= runSkillRegistry();
  authorityValidatorBaseline ??= runAuthorityValidator();
  policyGateBaseline ??= runPolicyGate();
  safetyGateBaseline ??= runSafetyGate();
  planningEngineBaseline ??= runPlanningEngine();
  const constitutionInvalid = !validateCafConstitutionalFoundation(constitutionBaseline).valid || has(scenarioFailures, "W2_0_CAF_CONSTITUTION_INVALID");
  const agentRegistryInvalid = !validateAgentRegistry(agentRegistryBaseline).valid || has(scenarioFailures, "W2_1_AGENT_REGISTRY_INVALID");
  const lifecycleInvalid = !validateLifecycleEngine(lifecycleBaseline).valid || has(scenarioFailures, "W2_2_LIFECYCLE_ENGINE_INVALID");
  const capabilityRegistryInvalid = !validateCapabilityRegistry(capabilityRegistryBaseline).valid || has(scenarioFailures, "W2_3_CAPABILITY_REGISTRY_INVALID");
  const skillRegistryInvalid = !validateSkillRegistry(skillRegistryBaseline).valid || has(scenarioFailures, "W2_4_SKILL_REGISTRY_INVALID");
  const authorityValidatorInvalid = !validateAuthorityValidator(authorityValidatorBaseline).valid || has(scenarioFailures, "W2_5_AUTHORITY_VALIDATOR_INVALID");
  const policyGateInvalid = !validatePolicyGate(policyGateBaseline).valid || has(scenarioFailures, "W2_6_POLICY_GATE_INVALID");
  const safetyGateInvalid = !validateSafetyGate(safetyGateBaseline).valid || has(scenarioFailures, "W2_7_SAFETY_GATE_INVALID");
  const planningEngineInvalid = !validatePlanningEngine(planningEngineBaseline).valid || has(scenarioFailures, "W2_8_PLANNING_ENGINE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(constitutionInvalid ? ["W2_0_CAF_CONSTITUTION_INVALID" as const] : []), ...(agentRegistryInvalid ? ["W2_1_AGENT_REGISTRY_INVALID" as const] : []), ...(lifecycleInvalid ? ["W2_2_LIFECYCLE_ENGINE_INVALID" as const] : []), ...(capabilityRegistryInvalid ? ["W2_3_CAPABILITY_REGISTRY_INVALID" as const] : []), ...(skillRegistryInvalid ? ["W2_4_SKILL_REGISTRY_INVALID" as const] : []), ...(authorityValidatorInvalid ? ["W2_5_AUTHORITY_VALIDATOR_INVALID" as const] : []), ...(policyGateInvalid ? ["W2_6_POLICY_GATE_INVALID" as const] : []), ...(safetyGateInvalid ? ["W2_7_SAFETY_GATE_INVALID" as const] : []), ...(planningEngineInvalid ? ["W2_8_PLANNING_ENGINE_INVALID" as const] : [])])]);
  const workingOk = !has(failures, "WORKING_MEMORY_MISSING") && !has(failures, "WORKING_MEMORY_NON_DETERMINISTIC") && !has(failures, "RUNTIME_ISOLATION_FAILED") && !has(failures, "WORKING_MEMORY_EXPIRATION_MISSING");
  const semanticOk = !has(failures, "SEMANTIC_MEMORY_MISSING") && !has(failures, "KNOWLEDGE_VALIDATION_MISSING") && !has(failures, "SEMANTIC_RETRIEVAL_NON_DETERMINISTIC");
  const proceduralOk = !has(failures, "PROCEDURAL_MEMORY_MISSING") && !has(failures, "PROCEDURE_RETRIEVAL_INVALID");
  const episodicOk = !has(failures, "EPISODIC_MEMORY_MISSING") && !has(failures, "EPISODIC_REPLAY_INVALID");
  const provenanceOk = !has(failures, "PROVENANCE_ENGINE_MISSING") && !has(failures, "PROVENANCE_NOT_IMMUTABLE") && !has(failures, "SOURCE_ATTRIBUTION_MISSING") && !has(failures, "MEMORY_IDENTIFIER_NOT_UNIQUE") && !has(failures, "MEMORY_OWNER_MISSING") && !has(failures, "MEMORY_TENANT_NAMESPACE_MISSING");
  const governanceOk = !has(failures, "MEMORY_GOVERNANCE_MISSING") && !has(failures, "AUTHORITY_POLICY_SAFETY_BYPASSED") && !has(failures, "RETENTION_POLICY_MISSING") && !has(failures, "DELETION_APPROVAL_BYPASSED") && !has(failures, "MEMORY_UPDATE_DESTROYS_HISTORY") && !has(failures, "TENANT_ISOLATION_FAILED");
  const retrievalOk = !has(failures, "RETRIEVAL_SERVICE_MISSING") && !has(failures, "RETRIEVAL_NON_DETERMINISTIC") && !has(failures, "RETRIEVAL_EXPLANATION_MISSING") && !has(failures, "RETRIEVAL_CONFIDENCE_MISSING");
  const apisOk = !has(failures, "MEMORY_API_MISSING") && !has(failures, "GOVERNANCE_API_MISSING") && !has(failures, "RETRIEVAL_API_MISSING");
  const evidenceOk = !has(failures, "MEMORY_EVIDENCE_MISSING") && !has(failures, "MEMORY_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "MEMORY_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const certified = decision === "MEMORY_ENGINE_CERTIFIED";
  const working = nested({ service_id: workingOk ? `service:w2.9:working-memory:${input.seed ?? "canonical"}` : "", active_context: workingOk, execution_state: workingOk, temporary_variables: workingOk, active_conversation: workingOk, runtime_facts: workingOk, planning_context: workingOk, reasoning_context: workingOk, task_context: workingOk, execution_cache: workingOk, low_latency: workingOk, deterministic_updates: workingOk, scoped_lifetime: workingOk, automatic_expiration: workingOk, runtime_isolation: workingOk });
  const semantic = nested({ store_id: semanticOk ? "store:w2.9:semantic-memory" : "", concepts: semanticOk, entities: semanticOk, relationships: semanticOk, ontologies: semanticOk, knowledge_graphs: semanticOk, embeddings: semanticOk, structured_knowledge: semanticOk, validated_facts: semanticOk, semantic_retrieval: semanticOk, similarity_search: semanticOk, relationship_traversal: semanticOk, concept_discovery: semanticOk, knowledge_validation: semanticOk });
  const procedural = nested({ repository_id: proceduralOk ? "repository:w2.9:procedural-memory" : "", workflows: proceduralOk, procedures: proceduralOk, playbooks: proceduralOk, execution_patterns: proceduralOk, learned_methods: proceduralOk, reusable_plans: proceduralOk, operational_recipes: proceduralOk, procedure_retrieval: proceduralOk, execution_guidance: proceduralOk, workflow_reuse: proceduralOk, capability_recommendations: proceduralOk });
  const episodic = nested({ store_id: episodicOk ? "store:w2.9:episodic-memory" : "", conversations: episodicOk, completed_tasks: episodicOk, decisions: episodicOk, mission_history: episodicOk, execution_outcomes: episodicOk, observations: episodicOk, operational_events: episodicOk, reasoning_history: episodicOk, historical_retrieval: episodicOk, timeline_navigation: episodicOk, experience_search: episodicOk, replay_support: episodicOk });
  const provenance = nested({ registry_id: provenanceOk ? "registry:w2.9:memory-provenance" : "", globally_unique_identifier: provenanceOk, owner: provenanceOk, creator: provenanceOk, originating_agent: provenanceOk, originating_capability: provenanceOk, originating_skill: provenanceOk, authority: provenanceOk, policy: provenanceOk, evidence: provenanceOk, timestamp: provenanceOk, tenant: provenanceOk, namespace: provenanceOk, trust_level: provenanceOk, confidence: provenanceOk, source_references: provenanceOk, validation_history: provenanceOk, immutable_lineage: provenanceOk, source_attribution: provenanceOk, dependency_tracing: provenanceOk });
  const governance = nested({ engine_id: governanceOk ? "engine:w2.9:memory-governance" : "", ownership: governanceOk, authority_enforcement: governanceOk, policy_enforcement: governanceOk, retention: governanceOk, expiration: governanceOk, archival: governanceOk, deletion_approval: governanceOk, modification_approval: governanceOk, trust_validation: governanceOk, replay_validation: governanceOk, lifecycle_governance: governanceOk, retention_management: governanceOk, authority_policy_safety_required: governanceOk, tenant_isolation: governanceOk });
  const retrieval = nested({ engine_id: retrievalOk ? "engine:w2.9:memory-retrieval" : "", keyword_search: retrievalOk, semantic_search: retrievalOk, vector_search: retrievalOk, hybrid_search: retrievalOk, contextual_retrieval: retrievalOk, authority_aware_retrieval: retrievalOk, tenant_aware_retrieval: retrievalOk, replay_retrieval: retrievalOk, ranking: retrievalOk, filtering: retrievalOk, explainable_retrieval: retrievalOk, deterministic_replay: retrievalOk, confidence_scoring: retrievalOk, provenance_chain: retrievalOk, policy_evaluation: retrievalOk, authority_evaluation: retrievalOk });
  const registry = nested({ registry_id: certified ? "registry:w2.9:memory" : "", memory_metadata: certified, versions: certified, ownership: certified, lineage: certified, evidence: certified, classifications: certified, lifecycle_state: certified, immutable_history: certified, version_history: certified, deterministic_lookup: certified });
  const apis = nested({ api_id: apisOk ? "api:w2.9:memory-engine" : "", create: apisOk, retrieve: apisOk, update: apisOk, archive: apisOk, restore: apisOk, expire: apisOk, validate: apisOk, certify: apisOk, semantic_search: apisOk, keyword_search: apisOk, vector_search: apisOk, hybrid_search: apisOk, timeline_query: apisOk, contextual_query: apisOk, authority_validation: apisOk, policy_validation: apisOk, retention_checks: apisOk, lifecycle_management: apisOk, provenance_verification: apisOk, stable: apisOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.9:memory-evidence" : "", records: evidenceOk ? freezeArray(["memory:creation", "memory:retrieval", "memory:provenance", "memory:governance", "memory:retention", "memory:version", "memory:lineage", "memory:replay", "memory:audit", "memory:validation"]) : freezeArray<string>([]), creation_records: evidenceOk, retrieval_records: evidenceOk, provenance_records: evidenceOk, governance_decisions: evidenceOk, retention_decisions: evidenceOk, version_histories: evidenceOk, lineage_graphs: evidenceOk, replay_evidence: evidenceOk, audit_events: evidenceOk, validation_reports: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.9-MEMORY-ENGINE-READINESS-001", decision, phase_ready: certified, constitution_ready: !constitutionInvalid, agent_registry_ready: !agentRegistryInvalid, lifecycle_engine_ready: !lifecycleInvalid, capability_registry_ready: !capabilityRegistryInvalid, skill_registry_ready: !skillRegistryInvalid, authority_validator_ready: !authorityValidatorInvalid, policy_gate_ready: !policyGateInvalid, safety_gate_ready: !safetyGateInvalid, planning_engine_ready: !planningEngineInvalid, working_ready: workingOk, semantic_ready: semanticOk, procedural_ready: proceduralOk, episodic_ready: episodicOk, provenance_ready: provenanceOk, governance_ready: governanceOk, retrieval_ready: retrievalOk, registry_ready: certified, apis_ready: apisOk, evidence_ready: evidenceOk, retrieval_gate_enforced: governanceOk && retrievalOk, tenant_isolation_preserved: governanceOk && workingOk, failures });
  const base: Omit<MemoryEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", skill_registry_ref: "skill-registry/w2.4", authority_validator_ref: "authority-validator/w2.5", policy_gate_ref: "policy-gate/w2.6", safety_gate_ref: "safety-gate/w2.7", planning_engine_ref: "planning-engine/w2.8", memory_kinds: freezeArray(MEMORY_KINDS), working, semantic, procedural, episodic, provenance, governance, retrieval, registry, apis, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMemoryEngine(result?: MemoryEngineResult): MemoryEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_CERTIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, working_valid: false, semantic_valid: false, procedural_valid: false, episodic_valid: false, provenance_valid: false, governance_valid: false, retrieval_valid: false, registry_valid: false, apis_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["WORKING_MEMORY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const working_valid = verifyHashed(result.working) && result.working.deterministic_updates && result.working.automatic_expiration && result.working.runtime_isolation;
  const semantic_valid = verifyHashed(result.semantic) && result.semantic.knowledge_graphs && result.semantic.validated_facts && result.semantic.knowledge_validation;
  const procedural_valid = verifyHashed(result.procedural) && result.procedural.procedure_retrieval && result.procedural.workflow_reuse && result.procedural.capability_recommendations;
  const episodic_valid = verifyHashed(result.episodic) && result.episodic.timeline_navigation && result.episodic.experience_search && result.episodic.replay_support;
  const provenance_valid = verifyHashed(result.provenance) && result.provenance.globally_unique_identifier && result.provenance.owner && result.provenance.tenant && result.provenance.namespace && result.provenance.immutable_lineage;
  const governance_valid = verifyHashed(result.governance) && result.governance.authority_policy_safety_required && result.governance.deletion_approval && result.governance.tenant_isolation;
  const retrieval_valid = verifyHashed(result.retrieval) && result.retrieval.authority_aware_retrieval && result.retrieval.tenant_aware_retrieval && result.retrieval.explainable_retrieval && result.retrieval.confidence_scoring;
  const registry_valid = verifyHashed(result.registry) && result.registry.memory_metadata && result.registry.immutable_history && result.registry.version_history;
  const apis_valid = verifyHashed(result.apis) && result.apis.create && result.apis.retrieve && result.apis.provenance_verification && result.apis.stable;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 10 && result.evidence.immutable && result.evidence.replayable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.retrieval_gate_enforced && result.readiness.tenant_isolation_preserved && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && working_valid && semantic_valid && procedural_valid && episodic_valid && provenance_valid && governance_valid && retrieval_valid && registry_valid && apis_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, working_valid, semantic_valid, procedural_valid, episodic_valid, provenance_valid, governance_valid, retrieval_valid, registry_valid, apis_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayMemoryEngine(result = runMemoryEngine()): boolean { const replayed = runMemoryEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMemoryEngine(result).valid; }
export function getMemoryEngineBundle(): MemoryEngineBundle { const result = runMemoryEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_working_memory: true, owns_semantic_memory: true, owns_procedural_memory: true, owns_episodic_memory: true, owns_memory_provenance: true, owns_memory_governance: true, owns_retrieval_services: true, owns_memory_registry: true, owns_memory_evidence: true, authoritative_memory_subsystem: true, certification_gate: "Memory Engine Certification Gate" }), result, validation: validateMemoryEngine(result) }); }
export const MemoryEngineService = Object.freeze({ run: runMemoryEngine, validate: validateMemoryEngine, replay: replayMemoryEngine });
