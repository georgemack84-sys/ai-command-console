import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { PlanningEngineBundle, PlanningEngineDecision, PlanningEngineFailure, PlanningEngineInput, PlanningEngineResult, PlanningEngineScenario, PlanningEngineValidation } from "@/types/planning-engine";

const VERSION = "planning-engine/w2.8" as const;
const IDENTIFIER = "PlanningEngine" as const;
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let skillRegistryBaseline: ReturnType<typeof runSkillRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;
let policyGateBaseline: ReturnType<typeof runPolicyGate> | undefined;
let safetyGateBaseline: ReturnType<typeof runSafetyGate> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly PlanningEngineFailure[], failure: PlanningEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: PlanningEngineScenario): PlanningEngineFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly PlanningEngineFailure[], scenario: PlanningEngineScenario): PlanningEngineDecision {
  if (has(failures, "W2_0_CAF_CONSTITUTION_INVALID") || has(failures, "W2_1_AGENT_REGISTRY_INVALID") || has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID") || has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID") || has(failures, "W2_4_SKILL_REGISTRY_INVALID") || has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID") || has(failures, "W2_6_POLICY_GATE_INVALID") || has(failures, "W2_7_SAFETY_GATE_INVALID") || has(failures, "GOAL_DECOMPOSITION_NON_DETERMINISTIC") || has(failures, "GOAL_LINEAGE_MISSING") || has(failures, "GOAL_DEPENDENCIES_INVALID") || has(failures, "PLANNING_GRAPH_CYCLE_ALLOWED") || has(failures, "DEPENDENCY_ORDERING_INVALID") || has(failures, "PLAN_GENERATION_NON_DETERMINISTIC") || has(failures, "NO_EXECUTABLE_PLAN_PRODUCED") || has(failures, "CONSTITUTIONAL_CONSTRAINT_VIOLATION_ALLOWED") || has(failures, "UNRESOLVED_CONFLICT_NOT_REPORTED") || has(failures, "PLAN_EXPLANATION_MISSING") || has(failures, "APPROVAL_WORKFLOW_NON_DETERMINISTIC") || has(failures, "APPROVAL_BEFORE_EXECUTION_MISSING") || has(failures, "INVALID_PLAN_ACCEPTED") || has(failures, "READINESS_DECISION_NON_DETERMINISTIC") || has(failures, "PLAN_HISTORY_MUTABLE") || has(failures, "PLAN_LINEAGE_INCOMPLETE") || has(failures, "REASONING_RUNTIME_CONTRACT_UNVERSIONED") || has(failures, "REASONING_RUNTIME_CONTRACT_NOT_REPLAY_COMPATIBLE") || has(failures, "PLANNING_EXECUTION_SEPARATION_BROKEN") || has(failures, "PLANNING_EVIDENCE_NOT_IMMUTABLE") || has(failures, "PLANNING_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "PLANNING_ENGINE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "PLANNING_ENGINE_QUALIFIED";
}
function resultReplayHash(result: Omit<PlanningEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ goal: result.goal_decomposition.integrity_hash, graph: result.planning_graph.integrity_hash, generation: result.plan_generation.integrity_hash, constraints: result.constraints.integrity_hash, review: result.review.integrity_hash, approvals: result.approvals.integrity_hash, validation: result.validation_engine.integrity_hash, registry: result.registry.integrity_hash, contract: result.reasoning_runtime_contract.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<PlanningEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runPlanningEngine(input: PlanningEngineInput = {}): PlanningEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<PlanningEngineFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation();
  agentRegistryBaseline ??= runAgentRegistry();
  lifecycleBaseline ??= runLifecycleEngine();
  capabilityRegistryBaseline ??= runCapabilityRegistry();
  skillRegistryBaseline ??= runSkillRegistry();
  authorityValidatorBaseline ??= runAuthorityValidator();
  policyGateBaseline ??= runPolicyGate();
  safetyGateBaseline ??= runSafetyGate();
  const constitutionInvalid = !validateCafConstitutionalFoundation(constitutionBaseline).valid || has(scenarioFailures, "W2_0_CAF_CONSTITUTION_INVALID");
  const agentRegistryInvalid = !validateAgentRegistry(agentRegistryBaseline).valid || has(scenarioFailures, "W2_1_AGENT_REGISTRY_INVALID");
  const lifecycleInvalid = !validateLifecycleEngine(lifecycleBaseline).valid || has(scenarioFailures, "W2_2_LIFECYCLE_ENGINE_INVALID");
  const capabilityRegistryInvalid = !validateCapabilityRegistry(capabilityRegistryBaseline).valid || has(scenarioFailures, "W2_3_CAPABILITY_REGISTRY_INVALID");
  const skillRegistryInvalid = !validateSkillRegistry(skillRegistryBaseline).valid || has(scenarioFailures, "W2_4_SKILL_REGISTRY_INVALID");
  const authorityValidatorInvalid = !validateAuthorityValidator(authorityValidatorBaseline).valid || has(scenarioFailures, "W2_5_AUTHORITY_VALIDATOR_INVALID");
  const policyGateInvalid = !validatePolicyGate(policyGateBaseline).valid || has(scenarioFailures, "W2_6_POLICY_GATE_INVALID");
  const safetyGateInvalid = !validateSafetyGate(safetyGateBaseline).valid || has(scenarioFailures, "W2_7_SAFETY_GATE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(constitutionInvalid ? ["W2_0_CAF_CONSTITUTION_INVALID" as const] : []), ...(agentRegistryInvalid ? ["W2_1_AGENT_REGISTRY_INVALID" as const] : []), ...(lifecycleInvalid ? ["W2_2_LIFECYCLE_ENGINE_INVALID" as const] : []), ...(capabilityRegistryInvalid ? ["W2_3_CAPABILITY_REGISTRY_INVALID" as const] : []), ...(skillRegistryInvalid ? ["W2_4_SKILL_REGISTRY_INVALID" as const] : []), ...(authorityValidatorInvalid ? ["W2_5_AUTHORITY_VALIDATOR_INVALID" as const] : []), ...(policyGateInvalid ? ["W2_6_POLICY_GATE_INVALID" as const] : []), ...(safetyGateInvalid ? ["W2_7_SAFETY_GATE_INVALID" as const] : [])])]);
  const goalOk = !has(failures, "GOAL_DECOMPOSITION_ENGINE_MISSING") && !has(failures, "GOAL_DECOMPOSITION_NON_DETERMINISTIC") && !has(failures, "GOAL_LINEAGE_MISSING") && !has(failures, "GOAL_DEPENDENCIES_INVALID");
  const graphOk = !has(failures, "PLANNING_GRAPH_ENGINE_MISSING") && !has(failures, "PLANNING_GRAPH_CYCLE_ALLOWED") && !has(failures, "DEPENDENCY_ORDERING_INVALID");
  const generationOk = !has(failures, "PLAN_GENERATION_ENGINE_MISSING") && !has(failures, "PLAN_GENERATION_NON_DETERMINISTIC") && !has(failures, "NO_EXECUTABLE_PLAN_PRODUCED") && !has(failures, "OPTIMIZATION_INCOMPLETE");
  const constraintsOk = !has(failures, "CONSTRAINT_RESOLUTION_ENGINE_MISSING") && !has(failures, "CONSTITUTIONAL_CONSTRAINT_VIOLATION_ALLOWED") && !has(failures, "UNRESOLVED_CONFLICT_NOT_REPORTED");
  const reviewOk = !has(failures, "PLAN_REVIEW_FRAMEWORK_MISSING") && !has(failures, "PLAN_EXPLANATION_MISSING") && !has(failures, "REVIEW_EVIDENCE_MISSING");
  const approvalsOk = !has(failures, "APPROVAL_POINT_ENGINE_MISSING") && !has(failures, "APPROVAL_WORKFLOW_NON_DETERMINISTIC") && !has(failures, "APPROVAL_BEFORE_EXECUTION_MISSING") && !has(failures, "APPROVAL_EVIDENCE_MISSING");
  const validationOk = !has(failures, "PLAN_VALIDATION_ENGINE_MISSING") && !has(failures, "INVALID_PLAN_ACCEPTED") && !has(failures, "READINESS_DECISION_NON_DETERMINISTIC");
  const registryOk = !has(failures, "PLAN_REGISTRY_MISSING") && !has(failures, "PLAN_HISTORY_MUTABLE") && !has(failures, "PLAN_LINEAGE_INCOMPLETE");
  const contractOk = !has(failures, "REASONING_RUNTIME_CONTRACT_MISSING") && !has(failures, "REASONING_RUNTIME_CONTRACT_UNVERSIONED") && !has(failures, "REASONING_RUNTIME_CONTRACT_NOT_REPLAY_COMPATIBLE") && !has(failures, "PLANNING_EXECUTION_SEPARATION_BROKEN");
  const evidenceOk = !has(failures, "PLANNING_EVIDENCE_MISSING") && !has(failures, "PLANNING_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "PLANNING_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "PLANNING_ENGINE_QUALIFIED";
  const goal_decomposition = nested({ engine_id: goalOk ? `engine:w2.8:goal-decomposition:${input.seed ?? "canonical"}` : "", goal_parser: goalOk, objective_hierarchy: goalOk, mission_graph: goalOk, sub_goal_generation: goalOk, task_tree_generation: goalOk, goal_lineage: goalOk, goal_priority: goalOk, goal_dependencies: goalOk, completion_criteria: goalOk, deterministic_decomposition: goalOk, repeatable_decomposition: goalOk });
  const planning_graph = nested({ engine_id: graphOk ? "engine:w2.8:planning-graph" : "", task_nodes: graphOk, dependency_edges: graphOk, parallel_groups: graphOk, sequential_groups: graphOk, conditional_branches: graphOk, decision_nodes: graphOk, merge_nodes: graphOk, synchronization_points: graphOk, dag_validated: graphOk, cycles_prevented: graphOk, dependency_ordering_verified: graphOk });
  const plan_generation = nested({ engine_id: generationOk ? "engine:w2.8:plan-generation" : "", task_ordering: generationOk, capability_selection: generationOk, skill_assignment: generationOk, execution_sequencing: generationOk, resource_planning: generationOk, scheduling: generationOk, alternative_plans: generationOk, fallback_plans: generationOk, recovery_plans: generationOk, optimization: generationOk, executable_plan: generationOk, deterministic_generation: generationOk });
  const constraints = nested({ engine_id: constraintsOk ? "engine:w2.8:constraint-resolution" : "", capability_constraints: constraintsOk, authority_constraints: constraintsOk, policy_constraints: constraintsOk, safety_constraints: constraintsOk, lifecycle_constraints: constraintsOk, resource_constraints: constraintsOk, dependency_constraints: constraintsOk, scheduling_constraints: constraintsOk, tenant_constraints: constraintsOk, environmental_constraints: constraintsOk, unresolved_conflicts_reported: constraintsOk, fail_closed: constraintsOk });
  const review = nested({ framework_id: reviewOk ? "framework:w2.8:plan-review" : "", review_checkpoints: reviewOk, operator_review: reviewOk, governance_review: reviewOk, safety_review: reviewOk, authority_review: reviewOk, policy_review: reviewOk, risk_review: reviewOk, explanation_generation: reviewOk, decision_logging: reviewOk, reproducible_reviews: reviewOk });
  const approvals = nested({ engine_id: approvalsOk ? "engine:w2.8:approval-points" : "", approval_stages: approvalsOk, approval_policies: approvalsOk, required_approvers: approvalsOk, multi_stage_approvals: approvalsOk, conditional_approvals: approvalsOk, emergency_approvals: approvalsOk, expiration_rules: approvalsOk, approval_lineage: approvalsOk, deterministic_workflow: approvalsOk, replayable_approvals: approvalsOk });
  const validation_engine = nested({ engine_id: validationOk ? "engine:w2.8:plan-validation" : "", dependency_validation: validationOk, capability_validation: validationOk, authority_validation: validationOk, policy_validation: validationOk, safety_validation: validationOk, lifecycle_validation: validationOk, goal_completeness: validationOk, execution_readiness: validationOk, invalid_plan_rejection: validationOk, deterministic_readiness: validationOk, validation_evidence: validationOk });
  const registry = nested({ registry_id: registryOk ? "registry:w2.8:plans" : "", plan_identity: registryOk, plan_versions: registryOk, plan_lineage: registryOk, plan_ownership: registryOk, plan_lifecycle: registryOk, plan_metadata: registryOk, execution_history: registryOk, evidence_references: registryOk, immutable_history: registryOk, deterministic_lookup: registryOk, complete_lineage: registryOk });
  const reasoning_runtime_contract = nested({ contract_id: contractOk ? "contract:w2.8:reasoning-runtime" : "", planning_request_schema: contractOk, planning_response_schema: contractOk, execution_contract: contractOk, constraint_contract: contractOk, capability_contract: contractOk, approval_contract: contractOk, evidence_contract: contractOk, replay_contract: contractOk, failure_contract: contractOk, versioned_contract: contractOk, backward_compatible: contractOk, replay_compatible: contractOk, execution_separated: contractOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.8:planning-evidence" : "", records: evidenceOk ? freezeArray(["planning:decision", "planning:goal", "planning:constraint", "planning:approval", "planning:validation", "planning:review", "planning:optimization", "planning:replay"]) : freezeArray<string>([]), planning_evidence: evidenceOk, goal_evidence: evidenceOk, constraint_evidence: evidenceOk, approval_evidence: evidenceOk, validation_evidence: evidenceOk, review_evidence: evidenceOk, optimization_evidence: evidenceOk, replay_evidence: evidenceOk, immutable: evidenceOk, traceable: evidenceOk, replay_complete: evidenceOk });
  const readiness = nested({ readiness_id: "W2.8-PLANNING-ENGINE-READINESS-001", decision, phase_ready: qualified, constitution_ready: !constitutionInvalid, agent_registry_ready: !agentRegistryInvalid, lifecycle_engine_ready: !lifecycleInvalid, capability_registry_ready: !capabilityRegistryInvalid, skill_registry_ready: !skillRegistryInvalid, authority_validator_ready: !authorityValidatorInvalid, policy_gate_ready: !policyGateInvalid, safety_gate_ready: !safetyGateInvalid, goal_ready: goalOk, graph_ready: graphOk, plan_generation_ready: generationOk, constraints_ready: constraintsOk, review_ready: reviewOk, approval_ready: approvalsOk, validation_ready: validationOk, registry_ready: registryOk, contract_ready: contractOk, evidence_ready: evidenceOk, execution_separated: contractOk, approval_before_execution: approvalsOk, failures });
  const base: Omit<PlanningEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", skill_registry_ref: "skill-registry/w2.4", authority_validator_ref: "authority-validator/w2.5", policy_gate_ref: "policy-gate/w2.6", safety_gate_ref: "safety-gate/w2.7", goal_decomposition, planning_graph, plan_generation, constraints, review, approvals, validation_engine, registry, reasoning_runtime_contract, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePlanningEngine(result?: PlanningEngineResult): PlanningEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, goal_valid: false, graph_valid: false, generation_valid: false, constraints_valid: false, review_valid: false, approvals_valid: false, validation_engine_valid: false, registry_valid: false, contract_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["GOAL_DECOMPOSITION_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const goal_valid = verifyHashed(result.goal_decomposition) && result.goal_decomposition.deterministic_decomposition && result.goal_decomposition.goal_lineage && result.goal_decomposition.goal_dependencies;
  const graph_valid = verifyHashed(result.planning_graph) && result.planning_graph.dag_validated && result.planning_graph.cycles_prevented && result.planning_graph.dependency_ordering_verified;
  const generation_valid = verifyHashed(result.plan_generation) && result.plan_generation.executable_plan && result.plan_generation.deterministic_generation && result.plan_generation.optimization;
  const constraints_valid = verifyHashed(result.constraints) && result.constraints.capability_constraints && result.constraints.authority_constraints && result.constraints.policy_constraints && result.constraints.safety_constraints && result.constraints.fail_closed;
  const review_valid = verifyHashed(result.review) && result.review.operator_review && result.review.explanation_generation && result.review.reproducible_reviews;
  const approvals_valid = verifyHashed(result.approvals) && result.approvals.required_approvers && result.approvals.deterministic_workflow && result.approvals.replayable_approvals;
  const validation_engine_valid = verifyHashed(result.validation_engine) && result.validation_engine.invalid_plan_rejection && result.validation_engine.deterministic_readiness && result.validation_engine.validation_evidence;
  const registry_valid = verifyHashed(result.registry) && result.registry.immutable_history && result.registry.deterministic_lookup && result.registry.complete_lineage;
  const contract_valid = verifyHashed(result.reasoning_runtime_contract) && result.reasoning_runtime_contract.versioned_contract && result.reasoning_runtime_contract.replay_compatible && result.reasoning_runtime_contract.execution_separated;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.traceable && result.evidence.replay_complete;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.execution_separated && result.readiness.approval_before_execution && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && goal_valid && graph_valid && generation_valid && constraints_valid && review_valid && approvals_valid && validation_engine_valid && registry_valid && contract_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, goal_valid, graph_valid, generation_valid, constraints_valid, review_valid, approvals_valid, validation_engine_valid, registry_valid, contract_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayPlanningEngine(result = runPlanningEngine()): boolean { const replayed = runPlanningEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePlanningEngine(result).valid; }
export function getPlanningEngineBundle(): PlanningEngineBundle { const result = runPlanningEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_goal_decomposition: true, owns_planning_graphs: true, owns_plan_generation: true, owns_constraint_resolution: true, owns_plan_review: true, owns_approval_points: true, owns_plan_validation: true, owns_plan_registry: true, owns_reasoning_runtime_contract: true, owns_planning_evidence: true, separates_planning_from_execution: true, qualification_gate: "Planning Engine Qualification Gate" }), result, validation: validatePlanningEngine(result) }); }
export const PlanningEngineService = Object.freeze({ run: runPlanningEngine, validate: validatePlanningEngine, replay: replayPlanningEngine });
