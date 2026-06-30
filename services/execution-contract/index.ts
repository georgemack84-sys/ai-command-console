import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies, validateDependencyGraph } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage } from "@/services/alternative-planning";
import { buildContingencyPlanningPackage } from "@/services/contingency-planning";
import { buildPlanningConfidenceAssessment, validatePlanningConfidenceAssessment } from "@/services/planning-confidence";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { PlanningConfidenceAssessment } from "@/types/planning-confidence";
import type {
  ExecutionCertificationState,
  ExecutionCheckpoint,
  ExecutionContract,
  ExecutionContractFramework,
  ExecutionContractScenario,
  ExecutionContractValidationResult,
  ExecutionFailureReason,
  ExecutionReplayResult,
  ExecutionState,
  ExecutionStateValidationResult,
} from "@/types/execution-contract";
import type { ExecutionContractVisibilitySurface } from "@/types/execution-contract";

const NOW = "2026-06-29T09:00:00.000Z";
const ALLOWED_TRANSITIONS: Readonly<Record<ExecutionState, readonly ExecutionState[]>> = Object.freeze({
  CREATED: ["VALIDATED"],
  VALIDATED: ["REGISTERED"],
  REGISTERED: ["READY"],
  READY: ["RUNNING"],
  RUNNING: ["WAITING", "PAUSED", "COMPLETED", "FAILED"],
  WAITING: ["RUNNING"],
  PAUSED: ["RUNNING"],
  COMPLETED: ["ARCHIVED"],
  FAILED: ["ROLLED_BACK", "ARCHIVED"],
  ROLLED_BACK: ["ARCHIVED"],
  ARCHIVED: [],
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function uniqueFailures(values: readonly ExecutionFailureReason[]): readonly ExecutionFailureReason[] {
  return freezeArray([...new Set(values)]);
}

function defaultPlanning(identity: AutonomyIdentityRecord) {
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  const contingencyPackage = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
  const confidence = buildPlanningConfidenceAssessment(identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage);
  return { hierarchy, graph, optimizedPlan, confidence };
}

export function generateExecutionIdentity(identity = generateAutonomyIdentity(), confidence?: PlanningConfidenceAssessment, scenario: ExecutionContractScenario = "BASELINE") {
  const planning = confidence ?? defaultPlanning(identity).confidence;
  return Object.freeze({
    execution_id: id("EXE", "execution-id", { tenant: planning.tenant_id, plan: planning.plan_id, scenario }),
    execution_version: "8C.1.0",
    execution_name: `execution-${planning.mission_id}`,
    execution_type: "CONTROLLED_AUTONOMY" as const,
  });
}

function checkpointHash(source: Omit<ExecutionCheckpoint, "integrity_hash">): string {
  return hashValue("execution-checkpoint", source);
}

function buildCheckpoints(executionId: string, states: readonly ExecutionState[], scenario: ExecutionContractScenario): readonly ExecutionCheckpoint[] {
  if (scenario === "MISSING_CHECKPOINT") return freezeArray([]);
  return freezeArray(states.map((state, index) => {
    const source = {
      checkpoint_id: id("CHK", "execution-checkpoint-id", { executionId, state, index }),
      checkpoint_number: index + 1,
      execution_state: state,
      workflow_state: `workflow:${state.toLowerCase()}`,
      timestamp: NOW,
    };
    return Object.freeze({ ...source, integrity_hash: checkpointHash(source) });
  }));
}

function buildTransitions(states: readonly ExecutionState[], scenario: ExecutionContractScenario) {
  const pairs = states.slice(1).map((state, index) => Object.freeze({
    from_state: states[index],
    to_state: state,
    transition_reference: id("EXT", "execution-transition-id", { from: states[index], to: state, index, scenario }),
    timestamp: NOW,
  }));
  if (scenario === "ILLEGAL_TRANSITION") {
    return freezeArray([Object.freeze({ from_state: "CREATED" as const, to_state: "RUNNING" as const, transition_reference: id("EXT", "illegal-transition", scenario), timestamp: NOW })]);
  }
  if (scenario === "SKIPPED_LIFECYCLE") {
    return freezeArray([Object.freeze({ from_state: "CREATED" as const, to_state: "REGISTERED" as const, transition_reference: id("EXT", "skipped-transition", scenario), timestamp: NOW })]);
  }
  if (scenario === "DUPLICATE_TRANSITION") return freezeArray([...pairs, pairs[0]]);
  return freezeArray(pairs);
}

function contractHashSource(contract: Omit<ExecutionContract, "integrity_hash"> | ExecutionContract) {
  return {
    execution_identity: contract.execution_identity,
    workflow_identity: contract.workflow_identity,
    plan_association: contract.plan_association,
    tenant_information: contract.tenant_information,
    mission_association: contract.mission_association,
    operator_information: contract.operator_information,
    authority_scope: contract.authority_scope,
    governance_references: contract.governance_references,
    execution_state: contract.execution_state,
    current_step: contract.current_step,
    dependency_graph: contract.dependency_graph,
    checkpoint_list: contract.checkpoint_list,
    rollback_plan: contract.rollback_plan,
    execution_constraints: contract.execution_constraints,
    timestamps: contract.timestamps,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    state_transition_history: contract.state_transition_history,
    planning_confidence_id: contract.planning_confidence.confidence_assessment_id,
  };
}

export function computeExecutionContractHash(contract: Omit<ExecutionContract, "integrity_hash"> | ExecutionContract): string {
  return hashValue("execution-contract", contractHashSource(contract));
}

export function buildExecutionContract(identity = generateAutonomyIdentity(), confidence?: PlanningConfidenceAssessment, scenario: ExecutionContractScenario = "BASELINE"): ExecutionContract {
  const planning = confidence ? undefined : defaultPlanning(identity);
  const assessment = confidence ?? planning!.confidence;
  const graph = planning?.graph ?? defaultPlanning(identity).graph;
  const executionIdentity = generateExecutionIdentity(identity, assessment, scenario);
  const lifecycle: readonly ExecutionState[] = ["CREATED", "VALIDATED", "REGISTERED", "READY"];
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray<string>([]) : assessment.factor_scores.flatMap((factor) => factor.governance_refs);
  const authorityRefs = scenario === "MISSING_AUTHORITY" ? freezeArray<string>([]) : freezeArray(["authority:operator", "authority:governance"]);
  const replayReference = scenario === "MISSING_REPLAY" ? "" : assessment.replay_refs[0] ?? "";
  const checkpoints = buildCheckpoints(executionIdentity.execution_id, lifecycle, scenario);
  const rollbackReference = scenario === "MISSING_ROLLBACK" ? "" : `rollback:${executionIdentity.execution_id}:prepared`;
  const base = {
    execution_identity: executionIdentity,
    workflow_identity: Object.freeze({
      workflow_id: id("WF", "workflow-id", { plan: assessment.plan_id, scenario }),
      workflow_version: "8C.1.0",
      workflow_template: "controlled-autonomy-execution",
      workflow_revision: "rev-001",
    }),
    plan_association: Object.freeze({
      plan_id: assessment.plan_id,
      objective_id: assessment.objective_id,
      planning_reference: scenario === "UNAPPROVED_PLAN" ? "" : assessment.confidence_assessment_id,
      planning_version: "8B.6",
    }),
    tenant_information: Object.freeze({
      tenant_id: scenario === "INVALID_TENANT" ? "tenant_beta" : assessment.tenant_id,
      organization_id: "org_mission_control",
      environment: "STAGING" as const,
      classification: "RESTRICTED" as const,
    }),
    mission_association: Object.freeze({
      mission_id: assessment.mission_id,
      mission_phase: "execution-contract",
      mission_state: "pre-orchestration",
      mission_priority: "HIGH" as const,
    }),
    operator_information: Object.freeze({
      operator_id: scenario === "MISSING_OPERATOR" ? "" : `operator:${identity.primary.autonomy_id}`,
      approval_reference: scenario === "MISSING_OPERATOR" ? "" : `approval:${assessment.confidence_assessment_id}`,
      approval_timestamp: scenario === "MISSING_OPERATOR" ? "" : NOW,
      operator_role: "mission-operator",
    }),
    authority_scope: Object.freeze({
      authority_scope: authorityRefs,
      authority_level: "bounded",
      authority_policy: "operator-supervised",
      authority_validation_reference: authorityRefs.length ? `authority-validation:${executionIdentity.execution_id}` : "",
    }),
    governance_references: Object.freeze({
      governance_state: governanceRefs.length ? "validated" : "",
      policy_snapshot: freezeArray(governanceRefs),
      compliance_snapshot: governanceRefs.length ? freezeArray(["compliance:execution-contract"]) : freezeArray<string>([]),
      risk_snapshot: "risk:pre-orchestration",
      recommendation_reference: assessment.confidence_assessment_id,
    }),
    execution_state: "CREATED" as const,
    current_step: Object.freeze({
      step_id: graph.critical_path[0] ?? "",
      step_name: "initial execution contract registration",
      step_sequence: 1,
      step_status: "PENDING" as const,
    }),
    dependency_graph: Object.freeze({
      predecessor_tasks: freezeArray(graph.edges.map((edge) => edge.from_task_id)),
      successor_tasks: freezeArray(graph.edges.map((edge) => edge.to_task_id)),
      synchronization_points: graph.parallel_groups.map((group, index) => `sync:${index + 1}:${group.join("+")}`),
      external_dependencies: scenario === "INVALID_DEPENDENCY_GRAPH" ? freezeArray(["external:unknown"]) : freezeArray(["truth-ledger", "authority-validator"]),
      governance_dependencies: freezeArray(governanceRefs),
      acyclic: scenario !== "INVALID_DEPENDENCY_GRAPH",
      deterministic_hash: graph.integrity_hash,
    }),
    checkpoint_list: checkpoints,
    rollback_plan: Object.freeze({
      rollback_id: id("RB", "execution-rollback-id", { execution: executionIdentity.execution_id, scenario }),
      rollback_strategy: "operator-approved rollback",
      rollback_boundary: checkpoints.at(-1)?.checkpoint_id ?? "",
      rollback_steps: rollbackReference ? freezeArray(["pause execution", "restore checkpoint", "verify governance"]) : freezeArray<string>([]),
      rollback_validation: rollbackReference ? "prepared" : "",
      rollback_reference: rollbackReference,
    }),
    execution_constraints: freezeArray([
      Object.freeze({ constraint_id: id("EXC", "execution-constraint", "governance"), constraint_type: "GOVERNANCE" as const, description: "governance validation required before orchestration", enforced: governanceRefs.length > 0 }),
      Object.freeze({ constraint_id: id("EXC", "execution-constraint", "authority"), constraint_type: "AUTHORITY" as const, description: "operator authority required", enforced: authorityRefs.length > 0 }),
      Object.freeze({ constraint_id: id("EXC", "execution-constraint", "tenant"), constraint_type: "TENANT" as const, description: "tenant isolation required", enforced: true }),
      Object.freeze({ constraint_id: id("EXC", "execution-constraint", "retry"), constraint_type: "RETRY" as const, description: "bounded retries only", enforced: scenario !== "CONDITIONAL_WARNING" }),
    ]),
    timestamps: Object.freeze({
      created_at: NOW,
      validated_at: null,
      started_at: null,
      paused_at: null,
      completed_at: null,
      failed_at: null,
      rollback_at: null,
      archived_at: null,
    }),
    replay_reference: Object.freeze({
      replay_reference: replayReference,
      replay_version: "8C.1",
      replay_hash: replayReference ? hashValue("execution-replay-reference", replayReference) : "",
      reconstruction_reference: replayReference ? `reconstruct:${executionIdentity.execution_id}` : "",
    }),
    lineage_reference: scenario === "MISSING_REPLAY" ? "" : assessment.lineage_refs[0] ?? "",
    state_transition_history: buildTransitions(lifecycle, scenario),
    planning_confidence: assessment,
  };
  const contract = Object.freeze({ ...base, integrity_hash: computeExecutionContractHash(base) });
  if (scenario !== "INTEGRITY_MISMATCH") return contract;
  return Object.freeze({ ...contract, integrity_hash: "tampered" });
}

function contractFailures(contract: ExecutionContract): ExecutionFailureReason[] {
  const failures: ExecutionFailureReason[] = [];
  if (!contract.execution_identity.execution_id || !contract.workflow_identity.workflow_id || !contract.plan_association.plan_id) failures.push("SCHEMA_INCOMPLETE");
  if (!contract.plan_association.planning_reference || contract.planning_confidence.classification === "INSUFFICIENT") failures.push("PLAN_NOT_APPROVED");
  if (!contract.governance_references.governance_state || contract.governance_references.policy_snapshot.length === 0) failures.push("GOVERNANCE_REFERENCE_MISSING");
  if (!contract.authority_scope.authority_validation_reference || contract.authority_scope.authority_scope.length === 0) failures.push("AUTHORITY_REFERENCE_MISSING");
  if (contract.tenant_information.tenant_id !== contract.planning_confidence.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!contract.operator_information.operator_id || !contract.operator_information.approval_reference) failures.push("OPERATOR_AUTHORIZATION_MISSING");
  if (!contract.dependency_graph.acyclic) failures.push("DEPENDENCY_GRAPH_INVALID");
  if (contract.checkpoint_list.length === 0 || contract.checkpoint_list.some((checkpoint) => {
    const source = {
      checkpoint_id: checkpoint.checkpoint_id,
      checkpoint_number: checkpoint.checkpoint_number,
      execution_state: checkpoint.execution_state,
      workflow_state: checkpoint.workflow_state,
      timestamp: checkpoint.timestamp,
    };
    return checkpointHash(source) !== checkpoint.integrity_hash;
  })) failures.push("CHECKPOINT_STRUCTURE_INVALID");
  if (!contract.rollback_plan.rollback_reference || contract.rollback_plan.rollback_steps.length === 0) failures.push("ROLLBACK_REFERENCE_MISSING");
  if (!contract.replay_reference.replay_reference || !contract.replay_reference.reconstruction_reference || !contract.lineage_reference) failures.push("REPLAY_REFERENCE_MISSING");
  if (computeExecutionContractHash(contract) !== contract.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return failures;
}

export function validateExecutionContract(contract: ExecutionContract): ExecutionContractValidationResult {
  const failures = uniqueFailures(contractFailures(contract));
  const warnings = contract.execution_constraints.some((constraint) => !constraint.enforced) ? freezeArray<ExecutionFailureReason>(["WARNING_ONLY"]) : freezeArray<ExecutionFailureReason>([]);
  const certification: ExecutionCertificationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const has = (reason: ExecutionFailureReason) => failures.includes(reason);
  const source = { execution: contract.execution_identity.execution_id, certification, failures, warnings };
  return Object.freeze({
    validation_id: id("EXV", "execution-contract-validation-id", source),
    execution_id: contract.execution_identity.execution_id,
    certification_state: certification,
    failures,
    warnings,
    schema_complete: !has("SCHEMA_INCOMPLETE"),
    identity_valid: !has("IDENTITY_NOT_UNIQUE") && Boolean(contract.execution_identity.execution_id),
    governance_valid: !has("GOVERNANCE_REFERENCE_MISSING") && !has("GOVERNANCE_STATE_INCONSISTENT"),
    authority_valid: !has("AUTHORITY_REFERENCE_MISSING"),
    tenant_isolation_valid: !has("TENANT_ISOLATION_VIOLATION"),
    dependency_graph_valid: !has("DEPENDENCY_GRAPH_INVALID"),
    checkpoints_valid: !has("CHECKPOINT_STRUCTURE_INVALID"),
    rollback_valid: !has("ROLLBACK_REFERENCE_MISSING"),
    replay_valid: !has("REPLAY_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
    ready_for_workflow_orchestrator: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("execution-contract-validation", source),
  });
}

export function validateExecutionState(contract: ExecutionContract): ExecutionStateValidationResult {
  const failures: ExecutionFailureReason[] = [];
  const seen = new Set<string>();
  for (const transition of contract.state_transition_history) {
    const key = `${transition.from_state}->${transition.to_state}`;
    if (seen.has(key)) failures.push("DUPLICATE_STATE_TRANSITION");
    seen.add(key);
    if (!ALLOWED_TRANSITIONS[transition.from_state].includes(transition.to_state)) failures.push("ILLEGAL_STATE_TRANSITION");
  }
  if (contract.state_transition_history.some((transition) => transition.from_state === "CREATED" && transition.to_state !== "VALIDATED")) failures.push("LIFECYCLE_STAGE_SKIPPED");
  if (contract.execution_state === "ROLLED_BACK" && contract.state_transition_history.at(-1)?.to_state !== "ROLLED_BACK") failures.push("INVALID_ROLLBACK_STATE");
  const unique = uniqueFailures(failures);
  const certification: ExecutionCertificationState = unique.length ? "FAIL" : "PASS";
  const source = { execution: contract.execution_identity.execution_id, state: contract.execution_state, unique };
  return Object.freeze({
    state_validation_id: id("EXS", "execution-state-validation-id", source),
    execution_id: contract.execution_identity.execution_id,
    certification_state: certification,
    failures: unique,
    current_state: contract.execution_state,
    allowed_next_states: ALLOWED_TRANSITIONS[contract.execution_state],
    transition_history_valid: unique.length === 0,
    rollback_eligible: contract.execution_state === "FAILED",
    completion_eligible: contract.execution_state === "RUNNING",
    validation_hash: hashValue("execution-state-validation", source),
  });
}

export function replayExecutionContract(contract: ExecutionContract): ExecutionReplayResult {
  const failures: ExecutionFailureReason[] = [];
  if (computeExecutionContractHash(contract) !== contract.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!contract.replay_reference.replay_reference) failures.push("REPLAY_REFERENCE_MISSING");
  const source = {
    replay_id: id("EXR", "execution-contract-replay-id", contract.execution_identity.execution_id),
    execution_id: contract.execution_identity.execution_id,
    replay_state_order: freezeArray([contract.execution_state, ...contract.state_transition_history.map((transition) => transition.to_state)]),
    replay_checkpoint_ids: freezeArray(contract.checkpoint_list.map((checkpoint) => checkpoint.checkpoint_id)),
    replay_reconstruction_reference: contract.replay_reference.reconstruction_reference,
    validation_state: failures.length ? "FAIL" as const : validateExecutionContract(contract).certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("execution-contract-replay", source) });
}

export function buildExecutionContractVisibilitySurface(contract: ExecutionContract): ExecutionContractVisibilitySurface {
  const validation = validateExecutionContract(contract);
  return Object.freeze({
    execution_id: contract.execution_identity.execution_id,
    workflow_id: contract.workflow_identity.workflow_id,
    plan_id: contract.plan_association.plan_id,
    tenant_id: contract.tenant_information.tenant_id,
    mission_id: contract.mission_association.mission_id,
    execution_state: contract.execution_state,
    current_step: contract.current_step.step_id,
    checkpoint_ids: freezeArray(contract.checkpoint_list.map((checkpoint) => checkpoint.checkpoint_id)),
    rollback_reference: contract.rollback_plan.rollback_reference,
    governance_state: contract.governance_references.governance_state,
    authority_scope: contract.authority_scope.authority_scope,
    failure_reasons: validation.failures,
    integrity_status: validation.integrity_valid ? "VALID" : "INVALID",
  });
}

export function getExecutionContractFramework(): ExecutionContractFramework {
  const identity = generateAutonomyIdentity();
  const contract = buildExecutionContract(identity);
  return Object.freeze({
    identity,
    execution_contract: contract,
    contract_validation: validateExecutionContract(contract),
    state_validation: validateExecutionState(contract),
    replay: replayExecutionContract(contract),
    visibility: buildExecutionContractVisibilitySurface(contract),
  });
}
