import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies, validateDependencyGraph } from "@/services/dependency-analysis";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { ObjectiveHierarchyPackage } from "@/types/objective-decomposition";
import type {
  GovernanceCheckpoint,
  OptimizationCertificationState,
  OptimizationConstraint,
  OptimizationFailureReason,
  OptimizationIntakeRecord,
  OptimizationReplayResult,
  OptimizationScenario,
  OptimizationScores,
  OptimizationValidationResult,
  OptimizationVisibilitySurface,
  OptimizedExecutionStep,
  OptimizedParallelGroup,
  OptimizedPlanPackage,
  PlanningOptimizationFramework,
  RejectedOptimization,
  ReplayOptimizationModel,
  ResourceAllocation,
  SafetyMarginReport,
} from "@/types/planning-optimization";

const NOW = "2026-06-29T05:00:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

export function buildOptimizationIntake(identity = generateAutonomyIdentity(), hierarchy = decomposeObjective(identity), graph = analyzeDependencies(identity, hierarchy), scenario: OptimizationScenario = "BASELINE"): OptimizationIntakeRecord {
  const source = {
    optimization_intake_id: id("OI", "optimization-intake-id", { graph: graph.dependency_graph_id, scenario }),
    dependency_graph_id: graph.dependency_graph_id,
    objective_id: graph.objective_id,
    mission_id: graph.mission_id,
    tenant_id: scenario === "INVALID_TENANT" ? "tenant_beta" : graph.tenant_id,
    dependency_graph: graph,
    objective_hierarchy: hierarchy,
    critical_path: scenario === "MISSING_ORDERING" ? freezeArray<string>([]) : graph.critical_path,
    ready_tasks: graph.ready_tasks,
    blocked_tasks: scenario === "UNRESOLVED_BLOCKERS" ? freezeArray(["blocked-task"]) : graph.blocked_tasks,
    governance_constraints: scenario === "INCOMPLETE_GOVERNANCE" ? freezeArray([]) : hierarchy.governance_constraints,
    authority_requirements: hierarchy.authority_requirements,
    replay_reference: scenario === "MISSING_REPLAY" ? "" : graph.replay_reference,
  };
  return Object.freeze({ ...source, intake_hash: hashValue("optimization-intake", source) });
}

export function loadOptimizationConstraints(intake: OptimizationIntakeRecord, scenario: OptimizationScenario = "BASELINE"): readonly OptimizationConstraint[] {
  const constraints: OptimizationConstraint[] = [
    constraint("dependency graph valid", "HARD_CONSTRAINT", intake.dependency_graph.validation_state === "PASS" && scenario !== "UNCERTIFIED_GRAPH", "UNCERTIFIED_DEPENDENCY_GRAPH"),
    constraint("task ordering available", "HARD_CONSTRAINT", intake.critical_path.length > 0, "MISSING_TASK_ORDERING"),
    constraint("blockers resolved", "HARD_CONSTRAINT", intake.blocked_tasks.length === 0, "UNRESOLVED_BLOCKERS"),
    constraint("governance metadata complete", "HARD_CONSTRAINT", intake.governance_constraints.length > 0, "INCOMPLETE_GOVERNANCE_METADATA"),
    constraint("tenant isolated", "HARD_CONSTRAINT", intake.tenant_id === intake.objective_hierarchy.tenant_id, "INVALID_TENANT_CONTEXT"),
    constraint("replay reference present", "REPLAY_REQUIREMENT", Boolean(intake.replay_reference), "REPLAY_REFERENCE_MISSING"),
    constraint("safety margin preserved", "SAFETY_REQUIREMENT", scenario !== "SAFETY_MARGIN_REDUCED", "SAFETY_MARGIN_REDUCED"),
    constraint("policy guardrail preserved", "HARD_CONSTRAINT", scenario !== "POLICY_VIOLATION", "POLICY_VIOLATION"),
  ];
  return freezeArray(constraints);
}

function constraint(name: string, constraint_class: OptimizationConstraint["constraint_class"], satisfied: boolean, violation: OptimizationFailureReason): OptimizationConstraint {
  return Object.freeze({
    constraint_id: id("OC", "optimization-constraint-id", { name, constraint_class }),
    constraint_class,
    name,
    required: constraint_class !== "SOFT_PREFERENCE",
    satisfied,
    violation_reason: satisfied ? null : violation,
  });
}

function buildExecutionOrder(intake: OptimizationIntakeRecord, scenario: OptimizationScenario): readonly OptimizedExecutionStep[] {
  const order = scenario === "OUT_OF_ORDER" ? [intake.critical_path[1], intake.critical_path[0], ...intake.critical_path.slice(2)] : intake.critical_path;
  return freezeArray(order.filter(Boolean).map((taskId, index) => {
    const node = intake.dependency_graph.nodes.find((item) => item.task_id === taskId);
    return Object.freeze({
      task_id: taskId,
      sequence_index: index + 1,
      readiness_layer: Math.max(1, Math.ceil((index + 1) / 2)),
      milestone_id: node?.milestone_id ?? "",
      required_preconditions: freezeArray((node?.data_required ?? []).concat(node?.governance_required ?? [])),
    });
  }));
}

function buildParallelGroups(intake: OptimizationIntakeRecord, scenario: OptimizationScenario): readonly OptimizedParallelGroup[] {
  return freezeArray(intake.dependency_graph.parallel_groups.map((group, index) => Object.freeze({
    group_id: id("OPG", "optimization-parallel-group-id", { graph: intake.dependency_graph_id, index }),
    tasks: freezeArray(group),
    safety_validation: scenario === "UNSAFE_PARALLELISM" && index === 1 ? "FAIL" as const : "PASS" as const,
    resource_validation: scenario === "RESOURCE_CONTENTION" && index === 1 ? "FAIL" as const : "PASS" as const,
    governance_validation: scenario === "GOVERNANCE_SKIP" && index === 1 ? "FAIL" as const : "PASS" as const,
  })));
}

function buildResources(intake: OptimizationIntakeRecord, scenario: OptimizationScenario): readonly ResourceAllocation[] {
  const resourceIds = ["validation-service", "policy-engine", "deployment-system", "replay-engine", "truth-ledger"];
  return freezeArray(resourceIds.map((resource, index) => Object.freeze({
    resource_id: resource,
    assigned_tasks: freezeArray(intake.critical_path.filter((_, taskIndex) => taskIndex % resourceIds.length === index)),
    usage_window: `window-${index + 1}`,
    capacity_state: scenario === "RESOURCE_CONTENTION" && resource === "deployment-system" ? "CONTENDED" as const : "RESERVED" as const,
    tenant_scope: scenario === "INVALID_TENANT" && resource === "deployment-system" ? "tenant_beta" : intake.tenant_id,
  })));
}

function buildGovernanceCheckpoints(intake: OptimizationIntakeRecord, scenario: OptimizationScenario): readonly GovernanceCheckpoint[] {
  if (scenario === "GOVERNANCE_SKIP") return freezeArray([]);
  return freezeArray(intake.critical_path.map((taskId, index) => Object.freeze({
    checkpoint_id: id("OGC", "optimization-governance-checkpoint-id", { taskId, index }),
    required_before_task: taskId,
    policy_refs: freezeArray(["policy:v8A:active"]),
    compliance_refs: freezeArray(["compliance:required"]),
    authority_refs: freezeArray(intake.authority_requirements),
  })));
}

function buildSafety(intake: OptimizationIntakeRecord, scenario: OptimizationScenario): SafetyMarginReport {
  return Object.freeze({
    rollback_window: scenario === "SAFETY_MARGIN_REDUCED" ? "REDUCED" : "PRESERVED",
    operator_intervention_points: freezeArray(intake.critical_path.filter((_, index) => index === 1 || index === 3)),
    verification_points: freezeArray(intake.critical_path.slice(-2)),
    safe_stop_points: scenario === "SAFETY_MARGIN_REDUCED" ? freezeArray([]) : freezeArray(intake.critical_path.slice(0, 2)),
  });
}

function buildReplayModel(intake: OptimizationIntakeRecord, scenario: OptimizationScenario): ReplayOptimizationModel {
  const replayOrder = scenario === "NONDETERMINISTIC_REPLAY" ? [intake.critical_path[1], intake.critical_path[0], ...intake.critical_path.slice(2)].filter(Boolean) : intake.critical_path;
  return Object.freeze({
    replay_order: freezeArray(replayOrder),
    deterministic_tie_break_rules: scenario === "NONDETERMINISTIC_REPLAY" ? freezeArray([]) : freezeArray(["sort by sequence_index", "sort by task_id for ties"]),
    evidence_refs: freezeArray(intake.critical_path.map((taskId) => `evidence:${taskId}`)),
    lineage_refs: freezeArray(intake.critical_path.map((taskId) => `lineage:${taskId}`)),
  });
}

function rejected(reason: OptimizationFailureReason, violated: string): RejectedOptimization {
  return Object.freeze({
    optimization_id: id("RO", "rejected-optimization-id", { reason, violated }),
    reason_rejected: reason,
    violated_constraint: violated,
  });
}

function scorePlan(failures: readonly OptimizationFailureReason[], parallelCount: number): OptimizationScores {
  const hardFail = failures.some((failure) => ["POLICY_VIOLATION", "AUTHORITY_ESCALATION", "CONSTITUTIONAL_VIOLATION", "NONDETERMINISTIC_REPLAY"].includes(failure));
  const governance = hardFail ? 0 : 100;
  const safety = failures.includes("SAFETY_MARGIN_REDUCED") ? 60 : 95;
  const replay = failures.includes("NONDETERMINISTIC_REPLAY") ? 0 : 92;
  const execution = failures.includes("DEPENDENCY_ORDER_VIOLATION") ? 0 : 88;
  const parallel = failures.includes("UNSAFE_PARALLELISM") ? 0 : Math.min(90, 65 + parallelCount * 10);
  const resource = failures.includes("RESOURCE_CONTENTION") ? 45 : 86;
  const overall = hardFail ? 0 : Math.round((execution + parallel + resource + governance + safety + replay) / 6);
  return Object.freeze({
    execution_efficiency_score: execution,
    parallelism_score: parallel,
    resource_efficiency_score: resource,
    governance_compliance_score: governance,
    safety_margin_score: safety,
    replay_simplicity_score: replay,
    overall_optimization_score: overall,
  });
}

function planHashSource(plan: Omit<OptimizedPlanPackage, "integrity_hash"> | OptimizedPlanPackage) {
  return {
    optimized_plan_id: plan.optimized_plan_id,
    dependency_graph_id: plan.dependency_graph_id,
    objective_id: plan.objective_id,
    mission_id: plan.mission_id,
    tenant_id: plan.tenant_id,
    execution_order: plan.execution_order,
    parallel_groups: plan.parallel_groups,
    resource_allocation: plan.resource_allocation,
    governance_checkpoints: plan.governance_checkpoints,
    safety_margins: plan.safety_margins,
    replay_model: plan.replay_model,
    optimization_scores: plan.optimization_scores,
    rejected_optimizations: plan.rejected_optimizations,
    certification_state: plan.certification_state,
    created_timestamp: plan.created_timestamp,
  };
}

export function computeOptimizedPlanHash(plan: Omit<OptimizedPlanPackage, "integrity_hash"> | OptimizedPlanPackage): string {
  return hashValue("optimized-plan", planHashSource(plan));
}

export function optimizePlan(identity = generateAutonomyIdentity(), hierarchy = decomposeObjective(identity), graph = analyzeDependencies(identity, hierarchy), scenario: OptimizationScenario = "BASELINE"): OptimizedPlanPackage {
  const intake = buildOptimizationIntake(identity, hierarchy, graph, scenario);
  const constraints = loadOptimizationConstraints(intake, scenario);
  const failures = constraints.flatMap((item) => item.violation_reason ? [item.violation_reason] : []);
  if (scenario === "OUT_OF_ORDER") failures.push("DEPENDENCY_ORDER_VIOLATION");
  if (scenario === "UNSAFE_PARALLELISM") failures.push("UNSAFE_PARALLELISM");
  if (scenario === "RESOURCE_CONTENTION") failures.push("RESOURCE_CONTENTION");
  if (scenario === "GOVERNANCE_SKIP") failures.push("GOVERNANCE_CHECK_SKIPPED");
  if (scenario === "AUTHORITY_ESCALATION") failures.push("AUTHORITY_ESCALATION");
  if (scenario === "HIDDEN_OPTIMIZATION") failures.push("HIDDEN_OPTIMIZATION_PATH");
  if (scenario === "NONDETERMINISTIC_REPLAY") failures.push("NONDETERMINISTIC_REPLAY");
  if (scenario === "CONDITIONAL_REPORTING_GAP") failures.push("REPORTING_GAP");
  const executionOrder = buildExecutionOrder(intake, scenario);
  const parallelGroups = buildParallelGroups(intake, scenario);
  const resources = buildResources(intake, scenario);
  const checkpoints = buildGovernanceCheckpoints(intake, scenario);
  const safety = buildSafety(intake, scenario);
  const replay = buildReplayModel(intake, scenario);
  const uniqueFailures = freezeArray([...new Set(failures)]);
  const certification: OptimizationCertificationState = uniqueFailures.some((failure) => ["POLICY_VIOLATION", "AUTHORITY_ESCALATION", "CONSTITUTIONAL_VIOLATION", "DEPENDENCY_ORDER_VIOLATION", "UNSAFE_PARALLELISM", "NONDETERMINISTIC_REPLAY"].includes(failure)) ? "FAIL" : uniqueFailures.length ? "CONDITIONAL_PASS" : "PASS";
  const rejectedItems = freezeArray(uniqueFailures.map((failure) => rejected(failure, failure.toLowerCase().replace(/_/g, "-"))));
  const scores = scorePlan(uniqueFailures, parallelGroups.length);
  const base = {
    optimized_plan_id: id("OP", "optimized-plan-id", { graph: graph.dependency_graph_id, scenario }),
    dependency_graph_id: graph.dependency_graph_id,
    objective_id: graph.objective_id,
    mission_id: graph.mission_id,
    tenant_id: intake.tenant_id,
    execution_order: executionOrder,
    parallel_groups: parallelGroups,
    resource_allocation: resources,
    governance_checkpoints: checkpoints,
    safety_margins: safety,
    replay_model: replay,
    optimization_scores: scores,
    rejected_optimizations: rejectedItems,
    certification_state: certification,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: computeOptimizedPlanHash(base) });
}

export function validateOptimizedPlan(identity: AutonomyIdentityRecord, plan: OptimizedPlanPackage, graph = analyzeDependencies(identity, decomposeObjective(identity))): OptimizationValidationResult {
  const failures: OptimizationFailureReason[] = [];
  const graphValidation = validateDependencyGraph(identity, graph);
  if (!graphValidation.ready_for_optimization) failures.push("UNCERTIFIED_DEPENDENCY_GRAPH");
  if (plan.execution_order.length === 0) failures.push("MISSING_TASK_ORDERING");
  if (plan.execution_order.length > 0 && plan.execution_order.map((item) => item.task_id).join("|") !== graph.critical_path.join("|")) failures.push("DEPENDENCY_ORDER_VIOLATION");
  if (plan.parallel_groups.some((group) => group.safety_validation === "FAIL")) failures.push("UNSAFE_PARALLELISM");
  if (plan.parallel_groups.some((group) => group.resource_validation === "FAIL")) failures.push("RESOURCE_CONTENTION");
  if (plan.parallel_groups.some((group) => group.governance_validation === "FAIL") || plan.governance_checkpoints.length === 0) failures.push("GOVERNANCE_CHECK_SKIPPED");
  if (plan.resource_allocation.some((resource) => resource.tenant_scope !== identity.primary.tenant_id)) failures.push("CROSS_TENANT_RESOURCE");
  if (plan.resource_allocation.some((resource) => resource.capacity_state === "CONTENDED" || resource.capacity_state === "BLOCKED")) failures.push("RESOURCE_CONTENTION");
  if (plan.safety_margins.rollback_window !== "PRESERVED" || plan.safety_margins.safe_stop_points.length === 0) failures.push("SAFETY_MARGIN_REDUCED");
  if (plan.replay_model.replay_order.join("|") !== plan.execution_order.map((item) => item.task_id).join("|") || plan.replay_model.deterministic_tie_break_rules.length === 0) failures.push("NONDETERMINISTIC_REPLAY");
  failures.push(...plan.rejected_optimizations.map((item) => item.reason_rejected));
  if (computeOptimizedPlanHash(plan) !== plan.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = freezeArray([...new Set(failures)]);
  const has = (reason: OptimizationFailureReason) => uniqueFailures.includes(reason);
  const certification: OptimizationCertificationState = uniqueFailures.some((failure) => ["POLICY_VIOLATION", "AUTHORITY_ESCALATION", "CONSTITUTIONAL_VIOLATION", "DEPENDENCY_ORDER_VIOLATION", "UNSAFE_PARALLELISM", "NONDETERMINISTIC_REPLAY", "INTEGRITY_HASH_MISMATCH"].includes(failure)) ? "FAIL" : uniqueFailures.length ? "CONDITIONAL_PASS" : "PASS";
  const source = { plan: plan.optimized_plan_id, certification, uniqueFailures };
  return Object.freeze({
    validation_id: id("OPV", "optimized-plan-validation-id", source),
    optimized_plan_id: plan.optimized_plan_id,
    certification_state: certification,
    failures: uniqueFailures,
    dependency_graph_valid: !has("UNCERTIFIED_DEPENDENCY_GRAPH"),
    optimized_order_deterministic: !has("DEPENDENCY_ORDER_VIOLATION") && !has("NONDETERMINISTIC_REPLAY"),
    safe_parallelism_validated: !has("UNSAFE_PARALLELISM") && !has("RACE_CONDITION") && !has("AUTHORITY_OVERLAP"),
    resource_usage_safe: !has("RESOURCE_CONTENTION") && !has("CROSS_TENANT_RESOURCE") && !has("UNAUTHORIZED_RESOURCE"),
    governance_compliance_preserved: !has("GOVERNANCE_CHECK_SKIPPED") && !has("POLICY_VIOLATION") && !has("CONSTITUTIONAL_VIOLATION"),
    authority_boundaries_preserved: !has("AUTHORITY_ESCALATION"),
    safety_margin_preserved: !has("SAFETY_MARGIN_REDUCED") && !has("ROLLBACK_READINESS_LOST") && !has("OPERATOR_VISIBILITY_REDUCED"),
    replay_simplicity_preserved: !has("NONDETERMINISTIC_REPLAY"),
    tenant_isolation_enforced: !has("CROSS_TENANT_RESOURCE"),
    policy_violation_absent: !has("POLICY_VIOLATION"),
    ready_for_alternative_planning: certification === "PASS" || certification === "CONDITIONAL_PASS",
    validation_hash: hashValue("optimized-plan-validation", source),
  });
}

export function replayOptimizedPlan(plan: OptimizedPlanPackage): OptimizationReplayResult {
  const failures: OptimizationFailureReason[] = [];
  if (computeOptimizedPlanHash(plan) !== plan.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (plan.replay_model.replay_order.join("|") !== plan.execution_order.map((item) => item.task_id).join("|")) failures.push("NONDETERMINISTIC_REPLAY");
  const source = {
    replay_id: id("OPR", "optimized-plan-replay-id", plan.optimized_plan_id),
    optimized_plan_id: plan.optimized_plan_id,
    replay_order: plan.replay_model.replay_order,
    replay_parallel_groups: freezeArray(plan.parallel_groups.map((group) => group.group_id)),
    replay_evidence_refs: plan.replay_model.evidence_refs,
    validation_state: failures.length ? "FAIL" as const : plan.certification_state,
    failure_reason: failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("optimized-plan-replay", source) });
}

export function buildOptimizationVisibilitySurface(identity: AutonomyIdentityRecord, plan: OptimizedPlanPackage, graph = analyzeDependencies(identity, decomposeObjective(identity))): OptimizationVisibilitySurface {
  const validation = validateOptimizedPlan(identity, plan, graph);
  return Object.freeze({
    optimized_plan_id: plan.optimized_plan_id,
    certification_state: validation.certification_state,
    execution_order: freezeArray(plan.execution_order.map((step) => step.task_id)),
    parallel_groups: freezeArray(plan.parallel_groups.map((group) => group.tasks)),
    rejected_optimizations: plan.rejected_optimizations,
    scores: plan.optimization_scores,
    governance_checkpoints: freezeArray(plan.governance_checkpoints.map((checkpoint) => checkpoint.checkpoint_id)),
    safety_margin_status: plan.safety_margins,
    replay_order: plan.replay_model.replay_order,
    failure_reasons: validation.failures,
    integrity_status: validation.failures.includes("INTEGRITY_HASH_MISMATCH") ? "INVALID" : "VALID",
    hidden_optimizations_visible: false,
  });
}

export function getPlanningOptimizationFramework(): PlanningOptimizationFramework {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const intake = buildOptimizationIntake(identity, hierarchy, graph);
  const constraints = loadOptimizationConstraints(intake);
  const plan = optimizePlan(identity, hierarchy, graph);
  return Object.freeze({
    identity,
    intake,
    constraints,
    plan,
    validation: validateOptimizedPlan(identity, plan, graph),
    replay: replayOptimizedPlan(plan),
    visibility: buildOptimizationVisibilitySurface(identity, plan, graph),
  });
}
