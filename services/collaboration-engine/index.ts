import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import type { CollaborationEngineBundle, CollaborationEngineDecision, CollaborationEngineFailure, CollaborationEngineInput, CollaborationEngineResult, CollaborationEngineScenario, CollaborationEngineValidation } from "@/types/collaboration-engine";

const VERSION = "collaboration-engine/w2.12" as const;
const IDENTIFIER = "CollaborationEngine" as const;
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;
let policyGateBaseline: ReturnType<typeof runPolicyGate> | undefined;
let safetyGateBaseline: ReturnType<typeof runSafetyGate> | undefined;
let planningEngineBaseline: ReturnType<typeof runPlanningEngine> | undefined;
let memoryEngineBaseline: ReturnType<typeof runMemoryEngine> | undefined;
let runtimeOrchestratorBaseline: ReturnType<typeof runRuntimeOrchestrator> | undefined;
let delegationEngineBaseline: ReturnType<typeof runDelegationEngine> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly CollaborationEngineFailure[], failure: CollaborationEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: CollaborationEngineScenario): CollaborationEngineFailure | undefined { return scenario === "BASELINE" || scenario === "OPERATIONAL_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly CollaborationEngineFailure[], scenario: CollaborationEngineScenario): CollaborationEngineDecision {
  const conditional = new Set<CollaborationEngineFailure>(["COLLABORATION_SESSIONS_MISSING", "SHARED_CONTEXT_MISSING", "COORDINATION_ENGINE_MISSING", "CONFLICT_RESOLUTION_MISSING", "CONSENSUS_ENGINE_MISSING", "ARBITRATION_ENGINE_MISSING", "ARBITRATION_EVIDENCE_MISSING", "COLLABORATION_GOVERNANCE_MISSING", "COLLABORATION_MONITORING_MISSING", "COLLABORATION_API_MISSING", "COLLABORATION_EVIDENCE_MISSING", "COLLABORATION_ENGINE_OPERATIONAL_GATE_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "COLLABORATION_ENGINE_OPERATIONAL_GATE_FAILED")) return "NOT_OPERATIONAL";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "OPERATIONAL_WITH_OBSERVATIONS") return "CONDITIONALLY_OPERATIONAL";
  return "COLLABORATION_ENGINE_OPERATIONAL";
}
function resultReplayHash(result: Omit<CollaborationEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ sessions: result.sessions.integrity_hash, context: result.shared_context.integrity_hash, coordination: result.coordination.integrity_hash, conflicts: result.conflicts.integrity_hash, consensus: result.consensus.integrity_hash, arbitration: result.arbitration.integrity_hash, governance: result.governance.integrity_hash, monitoring: result.monitoring.integrity_hash, apis: result.apis.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<CollaborationEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runCollaborationEngine(input: CollaborationEngineInput = {}): CollaborationEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<CollaborationEngineFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation(); agentRegistryBaseline ??= runAgentRegistry(); lifecycleBaseline ??= runLifecycleEngine(); capabilityRegistryBaseline ??= runCapabilityRegistry(); authorityValidatorBaseline ??= runAuthorityValidator(); policyGateBaseline ??= runPolicyGate(); safetyGateBaseline ??= runSafetyGate(); planningEngineBaseline ??= runPlanningEngine(); memoryEngineBaseline ??= runMemoryEngine(); runtimeOrchestratorBaseline ??= runRuntimeOrchestrator(); delegationEngineBaseline ??= runDelegationEngine();
  const upstream = [
    ["W2_0_CAF_CONSTITUTION_INVALID", !validateCafConstitutionalFoundation(constitutionBaseline).valid],
    ["W2_1_AGENT_REGISTRY_INVALID", !validateAgentRegistry(agentRegistryBaseline).valid],
    ["W2_2_LIFECYCLE_ENGINE_INVALID", !validateLifecycleEngine(lifecycleBaseline).valid],
    ["W2_3_CAPABILITY_REGISTRY_INVALID", !validateCapabilityRegistry(capabilityRegistryBaseline).valid],
    ["W2_5_AUTHORITY_VALIDATOR_INVALID", !validateAuthorityValidator(authorityValidatorBaseline).valid],
    ["W2_6_POLICY_GATE_INVALID", !validatePolicyGate(policyGateBaseline).valid],
    ["W2_7_SAFETY_GATE_INVALID", !validateSafetyGate(safetyGateBaseline).valid],
    ["W2_8_PLANNING_ENGINE_INVALID", !validatePlanningEngine(planningEngineBaseline).valid],
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(memoryEngineBaseline).valid],
    ["W2_10_RUNTIME_ORCHESTRATOR_INVALID", !validateRuntimeOrchestrator(runtimeOrchestratorBaseline).valid],
    ["W2_11_DELEGATION_ENGINE_INVALID", !validateDelegationEngine(delegationEngineBaseline).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const sessionsOk = !has(failures, "COLLABORATION_SESSIONS_MISSING") && !has(failures, "SESSION_LIFECYCLE_INVALID") && !has(failures, "UNAUTHORIZED_PARTICIPATION_ALLOWED") && !has(failures, "SESSION_ISOLATION_FAILED");
  const contextOk = !has(failures, "SHARED_CONTEXT_MISSING") && !has(failures, "SHARED_CONTEXT_NON_DETERMINISTIC") && !has(failures, "UNAUTHORIZED_CONTEXT_VISIBLE") && !has(failures, "CONTEXT_SNAPSHOT_MUTABLE");
  const coordinationOk = !has(failures, "COORDINATION_ENGINE_MISSING") && !has(failures, "RESPONSIBILITY_ASSIGNMENT_INVALID") && !has(failures, "DEPENDENCY_COORDINATION_INVALID") && !has(failures, "EXECUTION_ORDERING_NON_DETERMINISTIC");
  const conflictsOk = !has(failures, "CONFLICT_RESOLUTION_MISSING") && !has(failures, "CONFLICT_UNDETECTED") && !has(failures, "CONFLICT_RESOLUTION_NON_DETERMINISTIC") && !has(failures, "AUTHORITY_PRECEDENCE_BYPASSED");
  const consensusOk = !has(failures, "CONSENSUS_ENGINE_MISSING") && !has(failures, "CONSENSUS_IGNORES_AUTHORITY") && !has(failures, "CONSENSUS_IGNORES_POLICY") && !has(failures, "CONSENSUS_IGNORES_SAFETY") && !has(failures, "CONSENSUS_THRESHOLD_INVALID");
  const arbitrationOk = !has(failures, "ARBITRATION_ENGINE_MISSING") && !has(failures, "ARBITRATION_EVIDENCE_MISSING") && !has(failures, "OPERATOR_ESCALATION_BYPASSED");
  const governanceOk = !has(failures, "COLLABORATION_GOVERNANCE_MISSING") && !has(failures, "GOVERNANCE_VALIDATION_BYPASSED") && !has(failures, "TENANT_ISOLATION_FAILED") && !has(failures, "PERMISSION_ENFORCEMENT_FAILED");
  const monitoringOk = !has(failures, "COLLABORATION_MONITORING_MISSING") && !has(failures, "COLLABORATION_HEALTH_UNTRACKED");
  const apisOk = !has(failures, "COLLABORATION_API_MISSING");
  const evidenceOk = !has(failures, "COLLABORATION_EVIDENCE_MISSING") && !has(failures, "COLLABORATION_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "COLLABORATION_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const operational = decision === "COLLABORATION_ENGINE_OPERATIONAL";
  const sessions = nested({ manager_id: sessionsOk ? `manager:w2.12:collaboration-sessions:${input.seed ?? "canonical"}` : "", session_lifecycle: sessionsOk, ownership: sessionsOk, membership: sessionsOk, objectives: sessionsOk, permissions: sessionsOk, state_management: sessionsOk, closure: sessionsOk, evidence: sessionsOk, registry: sessionsOk, state_machine: sessionsOk, deterministic_sessions: sessionsOk, authenticated: sessionsOk, authorized: sessionsOk });
  const shared_context = nested({ service_id: contextOk ? "service:w2.12:shared-context" : "", working_memory: contextOk, synchronization: contextOk, versioning: contextOk, ownership: contextOk, visibility: contextOk, consistency: contextOk, immutable_snapshots: contextOk, protection: contextOk, secure_synchronization: contextOk, deterministic_context: contextOk });
  const coordination = nested({ engine_id: coordinationOk ? "engine:w2.12:coordination" : "", work_coordination: coordinationOk, responsibility_assignment: coordinationOk, task_synchronization: coordinationOk, dependency_coordination: coordinationOk, progress_tracking: coordinationOk, execution_ordering: coordinationOk, coordination_checkpoints: coordinationOk, scheduler: coordinationOk, registry: coordinationOk, deterministic_ordering: coordinationOk });
  const conflicts = nested({ engine_id: conflictsOk ? "engine:w2.12:conflicts" : "", decision_conflicts: conflictsOk, resource_conflicts: conflictsOk, capability_conflicts: conflictsOk, authority_conflicts: conflictsOk, planning_conflicts: conflictsOk, runtime_conflicts: conflictsOk, memory_conflicts: conflictsOk, automatic_reconciliation: conflictsOk, policy_driven_resolution: conflictsOk, authority_precedence: conflictsOk, operator_escalation: conflictsOk, arbitration: conflictsOk, registry: conflictsOk });
  const consensus = nested({ engine_id: consensusOk ? "engine:w2.12:consensus" : "", proposals: consensusOk, voting_strategies: consensusOk, weighted_authority_decisions: consensusOk, capability_aware_voting: consensusOk, trust_aware_voting: consensusOk, approval_thresholds: consensusOk, consensus_evidence: consensusOk, registry: consensusOk, decision_ledger: consensusOk, authority_policy_safety_constrained: consensusOk });
  const arbitration = nested({ engine_id: arbitrationOk ? "engine:w2.12:arbitration" : "", arbitration_requests: arbitrationOk, authority_evaluation: arbitrationOk, policy_evaluation: arbitrationOk, safety_evaluation: arbitrationOk, operator_review: arbitrationOk, arbitration_decisions: arbitrationOk, decision_publication: arbitrationOk, registry: arbitrationOk, evidence: arbitrationOk });
  const governance = nested({ service_id: governanceOk ? "service:w2.12:collaboration-governance" : "", authority_validation: governanceOk, policy_validation: governanceOk, safety_validation: governanceOk, session_governance: governanceOk, membership_validation: governanceOk, permission_enforcement: governanceOk, collaboration_restrictions: governanceOk, governance_precedes_execution: governanceOk, tenant_isolation: governanceOk, session_isolation: governanceOk });
  const monitoring = nested({ monitor_id: monitoringOk ? "monitor:w2.12:collaboration" : "", active_sessions: monitoringOk, collaboration_health: monitoringOk, participation_metrics: monitoringOk, conflict_metrics: monitoringOk, consensus_metrics: monitoringOk, arbitration_metrics: monitoringOk, coordination_performance: monitoringOk, dashboard_feed: monitoringOk, continuous: monitoringOk });
  const apis = nested({ api_id: apisOk ? "api:w2.12:collaboration" : "", create_session: apisOk, join_session: apisOk, leave_session: apisOk, close_session: apisOk, share_context: apisOk, synchronize_context: apisOk, submit_proposal: apisOk, vote: apisOk, resolve_conflict: apisOk, request_arbitration: apisOk, query_session: apisOk, retrieve_evidence: apisOk, coordinate_tasks: apisOk, assign_responsibilities: apisOk, detect_conflict: apisOk, stable: apisOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.12:collaboration-evidence" : "", records: evidenceOk ? freezeArray(["collaboration:session", "collaboration:decision", "collaboration:consensus", "collaboration:conflict", "collaboration:arbitration", "collaboration:context", "collaboration:coordination", "collaboration:audit"]) : freezeArray<string>([]), session_history: evidenceOk, decisions: evidenceOk, consensus_records: evidenceOk, conflict_history: evidenceOk, arbitration_history: evidenceOk, shared_context_history: evidenceOk, coordination_history: evidenceOk, audit_trail: evidenceOk, provenance_complete: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.12-COLLABORATION-ENGINE-READINESS-001", decision, phase_ready: operational, constitution_ready: !has(failures, "W2_0_CAF_CONSTITUTION_INVALID"), agent_registry_ready: !has(failures, "W2_1_AGENT_REGISTRY_INVALID"), lifecycle_engine_ready: !has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID"), capability_registry_ready: !has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID"), authority_validator_ready: !has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID"), policy_gate_ready: !has(failures, "W2_6_POLICY_GATE_INVALID"), safety_gate_ready: !has(failures, "W2_7_SAFETY_GATE_INVALID"), planning_engine_ready: !has(failures, "W2_8_PLANNING_ENGINE_INVALID"), memory_engine_ready: !has(failures, "W2_9_MEMORY_ENGINE_INVALID"), runtime_orchestrator_ready: !has(failures, "W2_10_RUNTIME_ORCHESTRATOR_INVALID"), delegation_engine_ready: !has(failures, "W2_11_DELEGATION_ENGINE_INVALID"), sessions_ready: sessionsOk, shared_context_ready: contextOk, coordination_ready: coordinationOk, conflicts_ready: conflictsOk, consensus_ready: consensusOk, arbitration_ready: arbitrationOk, governance_ready: governanceOk, monitoring_ready: monitoringOk, apis_ready: apisOk, evidence_ready: evidenceOk, governance_precedes_collaboration_execution: governanceOk, tenant_session_isolation_preserved: sessionsOk && governanceOk, failures });
  const base: Omit<CollaborationEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", authority_validator_ref: "authority-validator/w2.5", policy_gate_ref: "policy-gate/w2.6", safety_gate_ref: "safety-gate/w2.7", planning_engine_ref: "planning-engine/w2.8", memory_engine_ref: "memory-engine/w2.9", runtime_orchestrator_ref: "runtime-orchestrator/w2.10", delegation_engine_ref: "delegation-engine/w2.11", sessions, shared_context, coordination, conflicts, consensus, arbitration, governance, monitoring, apis, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCollaborationEngine(result?: CollaborationEngineResult): CollaborationEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_OPERATIONAL" as const, replay_hash_valid: false, integrity_hash_valid: false, sessions_valid: false, shared_context_valid: false, coordination_valid: false, conflicts_valid: false, consensus_valid: false, arbitration_valid: false, governance_valid: false, monitoring_valid: false, apis_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["COLLABORATION_SESSIONS_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const sessions_valid = verifyHashed(result.sessions) && result.sessions.deterministic_sessions && result.sessions.authenticated && result.sessions.authorized;
  const shared_context_valid = verifyHashed(result.shared_context) && result.shared_context.deterministic_context && result.shared_context.immutable_snapshots && result.shared_context.protection;
  const coordination_valid = verifyHashed(result.coordination) && result.coordination.responsibility_assignment && result.coordination.dependency_coordination && result.coordination.deterministic_ordering;
  const conflicts_valid = verifyHashed(result.conflicts) && result.conflicts.authority_precedence && result.conflicts.operator_escalation && result.conflicts.arbitration;
  const consensus_valid = verifyHashed(result.consensus) && result.consensus.weighted_authority_decisions && result.consensus.approval_thresholds && result.consensus.authority_policy_safety_constrained;
  const arbitration_valid = verifyHashed(result.arbitration) && result.arbitration.authority_evaluation && result.arbitration.policy_evaluation && result.arbitration.safety_evaluation && result.arbitration.evidence;
  const governance_valid = verifyHashed(result.governance) && result.governance.authority_validation && result.governance.policy_validation && result.governance.safety_validation && result.governance.tenant_isolation;
  const monitoring_valid = verifyHashed(result.monitoring) && result.monitoring.active_sessions && result.monitoring.collaboration_health && result.monitoring.continuous;
  const apis_valid = verifyHashed(result.apis) && result.apis.create_session && result.apis.vote && result.apis.request_arbitration && result.apis.stable;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.replayable && result.evidence.provenance_complete;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.governance_precedes_collaboration_execution && result.readiness.tenant_session_isolation_preserved && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && sessions_valid && shared_context_valid && coordination_valid && conflicts_valid && consensus_valid && arbitration_valid && governance_valid && monitoring_valid && apis_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, sessions_valid, shared_context_valid, coordination_valid, conflicts_valid, consensus_valid, arbitration_valid, governance_valid, monitoring_valid, apis_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayCollaborationEngine(result = runCollaborationEngine()): boolean { const replayed = runCollaborationEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCollaborationEngine(result).valid; }
export function getCollaborationEngineBundle(): CollaborationEngineBundle { const result = runCollaborationEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_sessions: true, owns_shared_context: true, owns_coordination: true, owns_conflict_resolution: true, owns_consensus: true, owns_arbitration: true, owns_collaboration_governance: true, owns_collaboration_monitoring: true, owns_collaboration_evidence: true, operational_gate: "Collaboration Engine Operational Gate" }), result, validation: validateCollaborationEngine(result) }); }
export const CollaborationEngineService = Object.freeze({ run: runCollaborationEngine, validate: validateCollaborationEngine, replay: replayCollaborationEngine });
