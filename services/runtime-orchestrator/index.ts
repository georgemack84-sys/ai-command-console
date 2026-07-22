import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { RuntimeDisposition, RuntimeOrchestratorBundle, RuntimeOrchestratorDecision, RuntimeOrchestratorFailure, RuntimeOrchestratorInput, RuntimeOrchestratorResult, RuntimeOrchestratorScenario, RuntimeOrchestratorValidation, RuntimeRestrictionOutcome, RuntimeState } from "@/types/runtime-orchestrator";

const VERSION = "runtime-orchestrator/w2.10" as const;
const IDENTIFIER = "RuntimeOrchestrator" as const;
const STATES = Object.freeze<RuntimeState[]>(["REQUESTED", "VALIDATING", "READY", "STARTING", "RUNNING", "PAUSING", "PAUSED", "RECOVERING", "SUSPENDING", "SUSPENDED", "COMPLETING", "COMPLETED", "FAILING", "FAILED", "TERMINATING", "TERMINATED", "REVOKED"]);
const DISPOSITIONS = Object.freeze<RuntimeDisposition[]>(["accepted", "ready", "executing", "completed", "completed with restrictions", "paused", "suspended", "escalated", "denied", "failed", "terminated", "revoked", "fail-closed"]);
const RESTRICTION_OUTCOMES = Object.freeze<RuntimeRestrictionOutcome[]>(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "PAUSE", "SUSPEND", "ESCALATE", "DENY", "TERMINATE", "FAIL_CLOSED"]);
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let skillRegistryBaseline: ReturnType<typeof runSkillRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;
let policyGateBaseline: ReturnType<typeof runPolicyGate> | undefined;
let safetyGateBaseline: ReturnType<typeof runSafetyGate> | undefined;
let planningEngineBaseline: ReturnType<typeof runPlanningEngine> | undefined;
let memoryEngineBaseline: ReturnType<typeof runMemoryEngine> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly RuntimeOrchestratorFailure[], failure: RuntimeOrchestratorFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: RuntimeOrchestratorScenario): RuntimeOrchestratorFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly RuntimeOrchestratorFailure[], scenario: RuntimeOrchestratorScenario): RuntimeOrchestratorDecision {
  if (failures.some((failure) => !["RUNTIME_CONTROL_PLANE_MISSING", "CONTEXT_ASSEMBLY_MISSING", "REASONING_RUNTIME_ADAPTER_MISSING", "RUNTIME_RESTRICTION_ENGINE_MISSING", "TASK_EXECUTION_MISSING", "CHECKPOINT_SERVICE_MISSING", "RECOVERY_CONTROLLER_MISSING", "RUNTIME_API_MISSING", "RUNTIME_EVIDENCE_MISSING", "RUNTIME_ORCHESTRATOR_QUALIFICATION_FAILED"].includes(failure))) return "FAIL_CLOSED";
  if (has(failures, "RUNTIME_ORCHESTRATOR_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "QUALIFIED";
}
function resultReplayHash(result: Omit<RuntimeOrchestratorResult, "replay_hash" | "integrity_hash">): string { return hash({ control: result.control_plane.integrity_hash, context: result.context_assembly.integrity_hash, adapter: result.reasoning_adapter.integrity_hash, restrictions: result.restrictions.integrity_hash, task: result.task_execution.integrity_hash, checkpoints: result.checkpoints.integrity_hash, recovery: result.recovery.integrity_hash, apis: result.apis.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<RuntimeOrchestratorResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runRuntimeOrchestrator(input: RuntimeOrchestratorInput = {}): RuntimeOrchestratorResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<RuntimeOrchestratorFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation(); agentRegistryBaseline ??= runAgentRegistry(); lifecycleBaseline ??= runLifecycleEngine(); capabilityRegistryBaseline ??= runCapabilityRegistry(); skillRegistryBaseline ??= runSkillRegistry(); authorityValidatorBaseline ??= runAuthorityValidator(); policyGateBaseline ??= runPolicyGate(); safetyGateBaseline ??= runSafetyGate(); planningEngineBaseline ??= runPlanningEngine(); memoryEngineBaseline ??= runMemoryEngine();
  const upstream = [
    ["W2_0_CAF_CONSTITUTION_INVALID", !validateCafConstitutionalFoundation(constitutionBaseline).valid],
    ["W2_1_AGENT_REGISTRY_INVALID", !validateAgentRegistry(agentRegistryBaseline).valid],
    ["W2_2_LIFECYCLE_ENGINE_INVALID", !validateLifecycleEngine(lifecycleBaseline).valid],
    ["W2_3_CAPABILITY_REGISTRY_INVALID", !validateCapabilityRegistry(capabilityRegistryBaseline).valid],
    ["W2_4_SKILL_REGISTRY_INVALID", !validateSkillRegistry(skillRegistryBaseline).valid],
    ["W2_5_AUTHORITY_VALIDATOR_INVALID", !validateAuthorityValidator(authorityValidatorBaseline).valid],
    ["W2_6_POLICY_GATE_INVALID", !validatePolicyGate(policyGateBaseline).valid],
    ["W2_7_SAFETY_GATE_INVALID", !validateSafetyGate(safetyGateBaseline).valid],
    ["W2_8_PLANNING_ENGINE_INVALID", !validatePlanningEngine(planningEngineBaseline).valid],
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(memoryEngineBaseline).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const controlOk = !has(failures, "RUNTIME_CONTROL_PLANE_MISSING") && !has(failures, "LIFECYCLE_TRANSITION_INVALID_ALLOWED") && !has(failures, "DUPLICATE_EXECUTION_ALLOWED") && !has(failures, "TENANT_NAMESPACE_ISOLATION_FAILED") && !has(failures, "OPERATOR_SUPREMACY_WEAKENED");
  const contextOk = !has(failures, "CONTEXT_ASSEMBLY_MISSING") && !has(failures, "CONTEXT_ASSEMBLY_NON_DETERMINISTIC") && !has(failures, "UNAUTHORIZED_MEMORY_INCLUDED") && !has(failures, "CONTEXT_PROVENANCE_MISSING") && !has(failures, "STALE_DECISION_REUSED");
  const adapterOk = !has(failures, "REASONING_RUNTIME_ADAPTER_MISSING") && !has(failures, "PROVIDER_SPECIFIC_BEHAVIOR_LEAKED") && !has(failures, "UNAPPROVED_TOOL_ADDED") && !has(failures, "INVALID_OUTPUT_ACCEPTED");
  const restrictionsOk = !has(failures, "RUNTIME_RESTRICTION_ENGINE_MISSING") && !has(failures, "RESTRICTION_CONFLICT_UNRESOLVED") && !has(failures, "RESTRICTION_WEAKENED_WITHOUT_APPROVAL") && !has(failures, "BUDGET_ENFORCEMENT_MISSING");
  const taskOk = !has(failures, "TASK_EXECUTION_MISSING") && !has(failures, "TASK_DEPENDENCY_BYPASSED") && !has(failures, "SIDE_EFFECT_NOT_IDEMPOTENT") && !has(failures, "TASK_RESULT_SCHEMA_INVALID");
  const checkpointOk = !has(failures, "CHECKPOINT_SERVICE_MISSING") && !has(failures, "CHECKPOINT_NOT_IMMUTABLE") && !has(failures, "CHECKPOINT_INTEGRITY_INVALID") && !has(failures, "INCOMPATIBLE_CHECKPOINT_RESTORED");
  const recoveryOk = !has(failures, "RECOVERY_CONTROLLER_MISSING") && !has(failures, "RECOVERY_REUSED_INVALID_DECISION") && !has(failures, "SIDE_EFFECT_DUPLICATED_DURING_RECOVERY") && !has(failures, "REVOKED_RUNTIME_REVIVED");
  const apisOk = !has(failures, "RUNTIME_API_MISSING") && !has(failures, "RUNTIME_API_NOT_AUTHORIZED") && !has(failures, "RUNTIME_API_NOT_IDEMPOTENT") && !has(failures, "STRUCTURED_ERRORS_MISSING");
  const evidenceOk = !has(failures, "RUNTIME_EVIDENCE_MISSING") && !has(failures, "RUNTIME_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "RUNTIME_REPLAY_INVALID");
  const securityOk = !has(failures, "RUNTIME_SECURITY_ASSESSMENT_FAILED") && !has(failures, "RUNTIME_RESILIENCE_FAILED") && !has(failures, "RUNTIME_PERFORMANCE_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "QUALIFIED";
  const control_plane = nested({ plane_id: controlOk ? `plane:w2.10:runtime-control:${input.seed ?? "canonical"}` : "", instance_creation: controlOk, lifecycle_coordination: controlOk, execution_admission: controlOk, pause_resume_suspend_terminate: controlOk, runtime_ownership: controlOk, lease_management: controlOk, concurrency_control: controlOk, execution_supervision: controlOk, health_coordination: controlOk, command_processor: controlOk, evidence_emitter: controlOk, idempotent_creation: controlOk, lifecycle_validated_by_w22: controlOk, operator_controls_enforced: controlOk });
  const context_assembly = nested({ service_id: contextOk ? "service:w2.10:context-assembly" : "", execution_subject: contextOk, approved_plan_loaded: contextOk, authorized_memory_retrieved: contextOk, capability_skill_tool_resolution: contextOk, configuration_loaded: contextOk, authority_policy_safety_attached: contextOk, operator_disposition_attached: contextOk, data_minimization: contextOk, canonical_context_package: contextOk, context_provenance: contextOk, deterministic_package: contextOk, integrity_protected: contextOk, tenant_namespace_boundary: contextOk });
  const reasoning_adapter = nested({ adapter_id: adapterOk ? "adapter:w2.10:reasoning-runtime" : "", provider_neutral_request: adapterOk, provider_neutral_response: adapterOk, adapter_registry: adapterOk, runtime_selection_rules: adapterOk, compatibility_validation: adapterOk, structured_tool_interface: adapterOk, timeout_handling: adapterOk, streaming_normalization: adapterOk, output_validation: adapterOk, metadata_capture: adapterOk, health_checks: adapterOk, fallback_rules: adapterOk, provider_isolation: adapterOk, tool_interception: adapterOk });
  const restrictions = nested({ engine_id: restrictionsOk ? "engine:w2.10:runtime-restrictions" : "", source_adapters: restrictionsOk, normalization: restrictionsOk, composition: restrictionsOk, precedence_resolver: restrictionsOk, conflict_detector: restrictionsOk, effective_limits: restrictionsOk, dynamic_evaluation: restrictionsOk, budget_enforcement: restrictionsOk, tool_boundaries: restrictionsOk, data_boundaries: restrictionsOk, destination_boundaries: restrictionsOk, kill_conditions: restrictionsOk, outcomes: restrictionsOk ? freezeArray(RESTRICTION_OUTCOMES) : freezeArray<RuntimeRestrictionOutcome>([]), more_restrictive_only: restrictionsOk, replayable_history: restrictionsOk });
  const task_execution = nested({ service_id: taskOk ? "service:w2.10:task-execution" : "", task_admission: taskOk, queue_integration: taskOk, dependency_resolver: taskOk, dispatcher: taskOk, worker_interface: taskOk, tool_gateway: taskOk, result_validator: taskOk, timeout_controller: taskOk, retry_controller: taskOk, idempotency_service: taskOk, compensation_hook: taskOk, completion_service: taskOk, evidence_emitter: taskOk, valid_runtime_state_required: taskOk, side_effect_controls: taskOk });
  const checkpoints = nested({ service_id: checkpointOk ? "service:w2.10:checkpoints" : "", scheduler: checkpointOk, persistence: checkpointOk, registry: checkpointOk, integrity_service: checkpointOk, compatibility_validator: checkpointOk, retention_policy: checkpointOk, encryption: checkpointOk, lineage: checkpointOk, restoration_interface: checkpointOk, evidence: checkpointOk, immutable: checkpointOk, version_aware: checkpointOk, deterministic_resume: checkpointOk });
  const recovery = nested({ controller_id: recoveryOk ? "controller:w2.10:recovery" : "", failure_classification: recoveryOk, retry_decisions: recoveryOk, checkpoint_restoration: recoveryOk, compensating_actions: recoveryOk, runtime_restart: recoveryOk, plan_revalidation: recoveryOk, escalation: recoveryOk, terminal_failure_handling: recoveryOk, side_effect_reconciliation: recoveryOk, bounded_attempts: recoveryOk, deterministic_recovery: recoveryOk, revoked_runtime_blocked: recoveryOk });
  const apis = nested({ api_id: apisOk ? "api:w2.10:runtime" : "", runtime_management: apisOk, task_endpoints: apisOk, context_endpoints: apisOk, restriction_endpoints: apisOk, checkpoint_recovery_endpoints: apisOk, administrative_endpoints: apisOk, authenticated: apisOk, authorized: apisOk, idempotent_commands: apisOk, versioned: apisOk, structured_errors: apisOk, evidence_references: apisOk, deterministic_disposition: apisOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.10:runtime-evidence" : "", records: evidenceOk ? freezeArray(["runtime:creation", "runtime:admission", "runtime:lifecycle", "runtime:context", "runtime:memory", "runtime:restriction", "runtime:reasoning", "runtime:tool", "runtime:task", "runtime:checkpoint", "runtime:recovery", "runtime:operator", "runtime:emergency-stop", "runtime:termination"]) : freezeArray<string>([]), runtime_creation: evidenceOk, admission_decisions: evidenceOk, lifecycle_transitions: evidenceOk, context_assembly: evidenceOk, memory_retrieval: evidenceOk, restriction_calculation: evidenceOk, reasoning_invocation: evidenceOk, tool_invocation: evidenceOk, task_execution: evidenceOk, checkpoints: evidenceOk, recovery_attempts: evidenceOk, operator_interventions: evidenceOk, emergency_stops: evidenceOk, runtime_termination: evidenceOk, lineage_query: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.10-RUNTIME-ORCHESTRATOR-READINESS-001", decision, phase_ready: qualified && securityOk, constitution_ready: !has(failures, "W2_0_CAF_CONSTITUTION_INVALID"), agent_registry_ready: !has(failures, "W2_1_AGENT_REGISTRY_INVALID"), lifecycle_engine_ready: !has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID"), capability_registry_ready: !has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID"), skill_registry_ready: !has(failures, "W2_4_SKILL_REGISTRY_INVALID"), authority_validator_ready: !has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID"), policy_gate_ready: !has(failures, "W2_6_POLICY_GATE_INVALID"), safety_gate_ready: !has(failures, "W2_7_SAFETY_GATE_INVALID"), planning_engine_ready: !has(failures, "W2_8_PLANNING_ENGINE_INVALID"), memory_engine_ready: !has(failures, "W2_9_MEMORY_ENGINE_INVALID"), control_plane_ready: controlOk, context_ready: contextOk, adapter_ready: adapterOk, restrictions_ready: restrictionsOk, task_execution_ready: taskOk, checkpoints_ready: checkpointOk, recovery_ready: recoveryOk, apis_ready: apisOk, evidence_ready: evidenceOk, lifecycle_authority_preserved: controlOk, governance_sequence_preserved: restrictionsOk, tenant_namespace_isolated: controlOk && contextOk, failures });
  const base: Omit<RuntimeOrchestratorResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", skill_registry_ref: "skill-registry/w2.4", authority_validator_ref: "authority-validator/w2.5", policy_gate_ref: "policy-gate/w2.6", safety_gate_ref: "safety-gate/w2.7", planning_engine_ref: "planning-engine/w2.8", memory_engine_ref: "memory-engine/w2.9", runtime_states: freezeArray(STATES), dispositions: freezeArray(DISPOSITIONS), control_plane, context_assembly, reasoning_adapter, restrictions, task_execution, checkpoints, recovery, apis, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateRuntimeOrchestrator(result?: RuntimeOrchestratorResult): RuntimeOrchestratorValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, control_plane_valid: false, context_valid: false, adapter_valid: false, restrictions_valid: false, task_execution_valid: false, checkpoints_valid: false, recovery_valid: false, apis_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["RUNTIME_CONTROL_PLANE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const control_plane_valid = verifyHashed(result.control_plane) && result.control_plane.idempotent_creation && result.control_plane.lifecycle_validated_by_w22 && result.control_plane.operator_controls_enforced;
  const context_valid = verifyHashed(result.context_assembly) && result.context_assembly.deterministic_package && result.context_assembly.context_provenance && result.context_assembly.tenant_namespace_boundary;
  const adapter_valid = verifyHashed(result.reasoning_adapter) && result.reasoning_adapter.provider_isolation && result.reasoning_adapter.tool_interception && result.reasoning_adapter.output_validation;
  const restrictions_valid = verifyHashed(result.restrictions) && result.restrictions.outcomes.length === 8 && result.restrictions.more_restrictive_only && result.restrictions.budget_enforcement;
  const task_execution_valid = verifyHashed(result.task_execution) && result.task_execution.dependency_resolver && result.task_execution.idempotency_service && result.task_execution.side_effect_controls;
  const checkpoints_valid = verifyHashed(result.checkpoints) && result.checkpoints.immutable && result.checkpoints.version_aware && result.checkpoints.deterministic_resume;
  const recovery_valid = verifyHashed(result.recovery) && result.recovery.deterministic_recovery && result.recovery.revoked_runtime_blocked && result.recovery.side_effect_reconciliation;
  const apis_valid = verifyHashed(result.apis) && result.apis.authenticated && result.apis.authorized && result.apis.idempotent_commands && result.apis.structured_errors;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 14 && result.evidence.immutable && result.evidence.replayable && result.evidence.lineage_query;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.lifecycle_authority_preserved && result.readiness.governance_sequence_preserved && result.readiness.tenant_namespace_isolated && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && control_plane_valid && context_valid && adapter_valid && restrictions_valid && task_execution_valid && checkpoints_valid && recovery_valid && apis_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, control_plane_valid, context_valid, adapter_valid, restrictions_valid, task_execution_valid, checkpoints_valid, recovery_valid, apis_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayRuntimeOrchestrator(result = runRuntimeOrchestrator()): boolean { const replayed = runRuntimeOrchestrator(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateRuntimeOrchestrator(result).valid; }
export function getRuntimeOrchestratorBundle(): RuntimeOrchestratorBundle { const result = runRuntimeOrchestrator(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_runtime_control_plane: true, owns_context_assembly: true, owns_reasoning_runtime_adapter: true, owns_runtime_restrictions: true, owns_task_execution: true, owns_checkpointing: true, owns_recovery: true, owns_runtime_api: true, owns_runtime_evidence: true, does_not_grant_authority: true, does_not_override_policy: true, does_not_override_safety: true, qualification_gate: "Runtime Orchestrator Qualification Gate" }), result, validation: validateRuntimeOrchestrator(result) }); }
export const RuntimeOrchestratorService = Object.freeze({ run: runRuntimeOrchestrator, validate: validateRuntimeOrchestrator, replay: replayRuntimeOrchestrator });
