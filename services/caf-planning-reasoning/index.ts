import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runMemoryKnowledge, validateMemoryKnowledge } from "@/services/caf-memory-knowledge";
import type {
  AssumptionRecord,
  GoalNodeRecord,
  PlanningQualificationOutcome,
  PlanningReasoningBundle,
  PlanningReasoningFailure,
  PlanningReasoningInput,
  PlanningReasoningResult,
  PlanningReasoningScenario,
  PlanningReasoningValidation,
  ReasoningEvidenceEntry,
} from "@/types/caf-planning-reasoning";

const VERSION = "caf-planning-reasoning/v3.5" as const;
const IDENTIFIER = "CafPlanningReasoning" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: PlanningReasoningScenario): PlanningReasoningFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly PlanningReasoningFailure[], failure: PlanningReasoningFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly PlanningReasoningFailure[]): PlanningQualificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "NOT_QUALIFIED";
  return failures.length ? "NOT_QUALIFIED" : "QUALIFIED";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildEvidence(failures: readonly PlanningReasoningFailure[]): readonly ReasoningEvidenceEntry[] {
  const incomplete = has(failures, "EVIDENCE_INCOMPLETE");
  const events: readonly ReasoningEvidenceEntry["event_type"][] = freezeArray(["OBJECTIVE_QUALIFIED", "OBJECTIVE_SYNTHESIZED", "GOAL_GRAPH_CREATED", "DECOMPOSED", "PIPELINE_EVALUATED", "PLAN_GENERATED", "ASSUMPTION_RECORDED", "RECOMMENDATION_SYNTHESIZED", "REPLAY_VALIDATED", "CERTIFIED"]);
  return freezeArray(events.filter((event) => !(incomplete && event === "PIPELINE_EVALUATED")).map((event_type, index) => nested({
    evidence_id: `P3.5-EVIDENCE-${String(index + 1).padStart(3, "0")}`,
    event_type,
    evidence_refs: incomplete && event_type === "RECOMMENDATION_SYNTHESIZED" ? freezeArray([]) : freezeArray([`evidence:p3.5:${event_type.toLowerCase()}`]),
    lineage_ref: incomplete && event_type === "ASSUMPTION_RECORDED" ? "" : `lineage:p3.5:${event_type.toLowerCase()}`,
    sequence: index + 1,
    immutable: true,
    replayable: true,
  })));
}

function resultReplayHash(result: Omit<PlanningReasoningResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    objective: result.objective.integrity_hash,
    goal_graph: result.goal_graph.integrity_hash,
    decomposition: result.decomposition.integrity_hash,
    reasoning_pipeline: result.reasoning_pipeline.integrity_hash,
    candidate_plan: result.candidate_plan.integrity_hash,
    assumptions: result.assumptions.map((assumption) => assumption.integrity_hash),
    recommendation: result.recommendation.integrity_hash,
    governance: result.governance.integrity_hash,
    evidence: result.evidence.map((entry) => entry.integrity_hash),
    replay_validation: result.replay_validation.integrity_hash,
    observability: result.observability.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<PlanningReasoningResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runPlanningReasoning(input: PlanningReasoningInput = {}): PlanningReasoningResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<PlanningReasoningFailure>(direct ? [direct] : []);
  const p34 = runMemoryKnowledge();
  const p34Valid = validateMemoryKnowledge(p34).valid && !has(scenarioFailures, "P3_4_MEMORY_KNOWLEDGE_INVALID");
  const failures = freezeArray<PlanningReasoningFailure>(p34Valid ? scenarioFailures : [...scenarioFailures, "P3_4_MEMORY_KNOWLEDGE_INVALID"]);
  const tenant_id = has(failures, "TENANT_ISOLATION_VIOLATION") ? "tenant:cross-boundary" : input.tenant_id ?? "tenant:caf-primary";
  const objectiveQualified = !has(failures, "OBJECTIVE_NOT_QUALIFIED") && !has(failures, "AMBIGUOUS_OBJECTIVE_ACCEPTED");

  const objective = nested({
    objective_id: "P3.5-OBJECTIVE-001",
    objective_version: "1.0.0",
    tenant_id,
    mission_scope: "mission:p3.5:planning-baseline",
    agent_id: p34.memory_objects[0]?.owner_agent_ref ?? "agent:unknown",
    source_type: "OPERATOR_INSTRUCTION" as const,
    source_principal_id: "operator:p3.5:authorized",
    objective_statement: has(failures, "OBJECTIVE_SCOPE_EXPANDED") ? "Plan beyond declared scope" : "Produce a governed advisory plan for a certified CAF objective.",
    desired_outcome: "Bounded recommendation with explicit approvals.",
    success_criteria: freezeArray(["qualified objective", "cycle-safe goal graph", "advisory recommendation"]),
    failure_criteria: freezeArray(["authority ambiguity", "unsafe decomposition", "execution implied"]),
    constraints: has(failures, "DECOMPOSITION_WEAKENS_CONSTRAINTS") ? freezeArray(["scope:mission"]) : freezeArray(["scope:mission", "advisory-only", "no-execution"]),
    assumptions: has(failures, "HIDDEN_ASSUMPTION") ? freezeArray([]) : freezeArray(["operator remains approval authority"]),
    authority_requirements: freezeArray(["operator approval required before execution", "governance review required for elevated risk"]),
    capability_boundaries: freezeArray(["P1-CAP-001", "P1-CAP-002", "P1-CAP-003"]),
    qualification_status: objectiveQualified ? "QUALIFIED_WITH_CONSTRAINTS" as const : has(failures, "AMBIGUOUS_OBJECTIVE_ACCEPTED") ? "REQUIRES_CLARIFICATION" as const : "REJECTED" as const,
    advisory_only: true as const,
    evidence_refs: has(failures, "EVIDENCE_INCOMPLETE") ? freezeArray([]) : freezeArray(["evidence:p3.5:objective"]),
    lineage_refs: freezeArray(["lineage:p3.5:objective-source"]),
  });

  const goalNodes: readonly GoalNodeRecord[] = freezeArray([
    nested({
      goal_id: "P3.5-GOAL-001",
      objective_id: objective.objective_id,
      goal_type: "PRIMARY_OBJECTIVE" as const,
      goal_statement: "Qualify objective and preserve advisory boundary.",
      parent_goal_id: null,
      required_capabilities: freezeArray(["P1-CAP-001"]),
      required_evidence: freezeArray(["evidence:p3.5:objective"]),
      authority_requirements: freezeArray(["authority:planning-advisory"]),
      approval_requirements: freezeArray(["operator-review"]),
      lifecycle_status: "READY_FOR_PLANNING" as const,
      dependency_refs: freezeArray([]),
      conflict_refs: freezeArray([]),
    }),
    nested({
      goal_id: "P3.5-GOAL-002",
      objective_id: objective.objective_id,
      goal_type: "SUBGOAL" as const,
      goal_statement: "Decompose work into bounded planning units.",
      parent_goal_id: has(failures, "ORPHAN_GOAL_ACTIONABLE") ? null : "P3.5-GOAL-001",
      required_capabilities: has(failures, "UNAUTHORIZED_CAPABILITY_INSERTION") ? freezeArray(["P1-CAP-UNAUTHORIZED"]) : freezeArray(["P1-CAP-002"]),
      required_evidence: freezeArray(["evidence:p3.5:decomposition"]),
      authority_requirements: freezeArray(["authority:planning-advisory"]),
      approval_requirements: freezeArray(["operator-review"]),
      lifecycle_status: "PLANNED" as const,
      dependency_refs: freezeArray(["P3.5-GOAL-001"]),
      conflict_refs: has(failures, "GOAL_GRAPH_CYCLE") ? freezeArray(["P3.5-GOAL-001"]) : freezeArray([]),
    }),
  ]);
  const goal_graph = nested({
    graph_id: "P3.5-GOAL-GRAPH-001",
    objective_ref: objective.objective_id,
    nodes: goalNodes,
    edges: has(failures, "GOAL_GRAPH_CYCLE") ? freezeArray(["P3.5-GOAL-001->P3.5-GOAL-002", "P3.5-GOAL-002->P3.5-GOAL-001"]) : freezeArray(["P3.5-GOAL-001->P3.5-GOAL-002"]),
    cycles_detected: has(failures, "GOAL_GRAPH_CYCLE") ? freezeArray(["P3.5-GOAL-001/P3.5-GOAL-002"]) : freezeArray([]),
    orphan_goals: has(failures, "ORPHAN_GOAL_ACTIONABLE") ? freezeArray(["P3.5-GOAL-002"]) : freezeArray([]),
    conflicting_goals: freezeArray([]),
    versioned: true,
    constraints_propagated: !has(failures, "DECOMPOSITION_WEAKENS_CONSTRAINTS"),
    reconstructable_from_evidence: !has(failures, "EVIDENCE_INCOMPLETE"),
  });
  const decomposition = nested({
    decomposition_id: "P3.5-DECOMPOSITION-001",
    objective_ref: objective.objective_id,
    strategy_ref: "strategy:p3.5:bounded-goal-decomposition",
    outcome: has(failures, "UNAUTHORIZED_CAPABILITY_INSERTION") ? "REQUIRES_CAPABILITY" as const : "DECOMPOSED" as const,
    parent_child_lineage_complete: !has(failures, "ORPHAN_GOAL_ACTIONABLE"),
    child_constraints_at_least_as_restrictive: !has(failures, "DECOMPOSITION_WEAKENS_CONSTRAINTS"),
    missing_capabilities: has(failures, "UNAUTHORIZED_CAPABILITY_INSERTION") ? freezeArray(["P1-CAP-UNAUTHORIZED"]) : freezeArray([]),
    recursion_bounded: true,
    no_authority_expansion: !has(failures, "OBJECTIVE_SCOPE_EXPANDED") && !has(failures, "EXECUTION_AUTHORITY_GRANTED"),
    terminal_tasks_measurable: true,
  });
  const planStep = nested({
    step_id: "P3.5-PLAN-STEP-001",
    plan_id: "P3.5-PLAN-001",
    sequence_index: 1,
    purpose: "Prepare advisory recommendation package.",
    required_capability_ref: has(failures, "PLAN_STEP_MISSING_CAPABILITY") ? "" : "P1-CAP-002",
    dependency_step_refs: freezeArray([]),
    constraints: objective.constraints,
    evidence_requirements: freezeArray(["evidence:p3.5:plan-step"]),
    authority_requirement: "operator approval required before execution",
    approval_requirement: has(failures, "PLANNING_GOVERNANCE_BYPASS") ? "" : "operator-review",
    risk_classification: "MEDIUM" as const,
    reversibility_classification: "REVERSIBLE" as const,
    execution_prohibited: true as const,
  });
  const candidate_plan = nested({
    plan_id: "P3.5-PLAN-001",
    plan_version: "1.0.0",
    objective_ref: objective.objective_id,
    goal_graph_ref: goal_graph.graph_id,
    tenant_id,
    agent_id: objective.agent_id,
    planning_strategy: "bounded-advisory-planning",
    plan_steps: freezeArray([planStep]),
    feasibility_status: "FEASIBLE_WITH_APPROVAL" as const,
    assumption_refs: has(failures, "HIDDEN_ASSUMPTION") ? freezeArray([]) : freezeArray(["P3.5-ASSUMPTION-001"]),
    uncertainty_summary: has(failures, "UNCERTAINTY_NOT_PROPAGATED") ? "" : "Residual uncertainty requires operator review.",
    risk_summary: "Medium risk; execution remains prohibited until authorized.",
    approval_requirements: has(failures, "PLANNING_GOVERNANCE_BYPASS") ? freezeArray([]) : freezeArray(["operator-review"]),
    lifecycle_status: "RECOMMENDATION_SYNTHESIZED" as const,
    advisory_only: true as const,
  });
  const reasoning_pipeline = nested({
    pipeline_id: "P3.5-REASONING-PIPELINE-001",
    stages: freezeArray(["intake", "qualification", "synthesis", "goal-graph", "decomposition", "candidate-generation", "feasibility", "recommendation", "evidence", "replay"]),
    stage_order_deterministic: true,
    interruption_supported: true,
    resumption_supported: true,
    observable: !has(failures, "REASONING_PIPELINE_UNOBSERVABLE"),
    bounded_variability_declared: true,
  });
  const assumptions: readonly AssumptionRecord[] = freezeArray([nested({
    assumption_id: "P3.5-ASSUMPTION-001",
    plan_ref: candidate_plan.plan_id,
    assumption_statement: "Operator retains final authorization authority.",
    confidence: 0.96,
    materiality: "HIGH" as const,
    validation_status: has(failures, "HIDDEN_ASSUMPTION") ? "UNVALIDATED" as const : "VALIDATED" as const,
    evidence_refs: has(failures, "HIDDEN_ASSUMPTION") ? freezeArray([]) : freezeArray(["evidence:p3.5:assumption"]),
    hidden: has(failures, "HIDDEN_ASSUMPTION"),
  })]);
  const recommendation = nested({
    recommendation_id: "P3.5-RECOMMENDATION-001",
    objective_ref: objective.objective_id,
    selected_plan_ref: candidate_plan.plan_id,
    alternative_plan_refs: freezeArray(["P3.5-PLAN-ALT-001"]),
    recommendation_summary: "Recommend operator-reviewed advisory plan; do not execute from planning context.",
    supporting_evidence_refs: has(failures, "EVIDENCE_INCOMPLETE") ? freezeArray([]) : freezeArray(["evidence:p3.5:recommendation"]),
    assumption_refs: candidate_plan.assumption_refs,
    uncertainty_summary: candidate_plan.uncertainty_summary,
    confidence: 0.88,
    required_approvals: candidate_plan.approval_requirements,
    prohibited_actions: has(failures, "EXECUTION_AUTHORITY_GRANTED") ? freezeArray([]) : freezeArray(["execute-plan", "self-approve", "grant-capability"]),
    unresolved_dependencies: freezeArray([]),
    recommendation_outcome: "RECOMMEND_WITH_REVIEW" as const,
    advisory_only: !has(failures, "RECOMMENDATION_NOT_ADVISORY") && !has(failures, "EXECUTION_AUTHORITY_GRANTED"),
    replay_ref: "replay:p3.5:recommendation",
  });
  const governance = nested({
    governance_id: "P3.5-PLANNING-GOVERNANCE-001",
    authority_evaluated: !has(failures, "PLANNING_GOVERNANCE_BYPASS"),
    policy_compliance_validated: !has(failures, "PLANNING_GOVERNANCE_BYPASS"),
    approval_gates_present: candidate_plan.approval_requirements.length > 0,
    authority_laundering_detected: has(failures, "EXECUTION_AUTHORITY_GRANTED"),
    hidden_objective_expansion_detected: has(failures, "OBJECTIVE_SCOPE_EXPANDED"),
    execution_attempt_blocked: !has(failures, "EXECUTION_AUTHORITY_GRANTED"),
    tenant_isolation_enforced: !has(failures, "TENANT_ISOLATION_VIOLATION"),
    fail_closed_validated: !has(failures, "PLANNING_GOVERNANCE_BYPASS"),
  });
  const evidence = buildEvidence(failures);
  const evidenceComplete = evidence.length === 10 && evidence.every((entry) => entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && entry.lineage_ref);
  const replay_validation = nested({
    replay_validation_id: "P3.5-PLANNING-REPLAY-001",
    objective_replayed: objectiveQualified,
    goal_graph_replayed: goal_graph.cycles_detected.length === 0 && goal_graph.reconstructable_from_evidence,
    decomposition_replayed: decomposition.parent_child_lineage_complete && decomposition.child_constraints_at_least_as_restrictive,
    plan_replayed: candidate_plan.plan_steps.every((step) => step.required_capability_ref && step.execution_prohibited),
    recommendation_replayed: recommendation.advisory_only,
    divergence_classification: has(failures, "REPLAY_DIVERGENCE") ? "UNEXPLAINED_DIVERGENCE" as const : "NONE" as const,
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
  });
  const observability = nested({
    observability_id: "P3.5-PLANNING-OBSERVABILITY-001",
    metrics: Object.freeze({
      objectives_received: 1,
      objectives_qualified: objectiveQualified ? 1 : 0,
      objectives_rejected: objectiveQualified ? 0 : 1,
      candidate_plans_generated: 1,
      recommendation_rate: 1,
      operator_review_rate: 1,
      replay_match_rate: replay_validation.deterministic ? 1 : 0,
      unexplained_divergence_count: has(failures, "REPLAY_DIVERGENCE") ? 1 : 0,
      planning_violation_count: failures.length,
      fail_closed_event_count: failures.length ? 1 : 0,
    }),
    operator_controls: has(failures, "OPERATOR_CONTROL_MISSING") ? freezeArray(["inspect objective state"]) : freezeArray(["inspect objective state", "inspect goal graphs", "inspect candidate plans", "inspect assumptions", "inspect evidence", "invalidate a plan", "cancel a reasoning pipeline", "request replanning", "escalate to governance"]),
    complete_visibility: !has(failures, "OPERATOR_CONTROL_MISSING") && !has(failures, "REASONING_PIPELINE_UNOBSERVABLE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(!p34Valid ? ["P3_4_MEMORY_KNOWLEDGE_INVALID" as const] : []),
    ...(!objectiveQualified ? ["OBJECTIVE_NOT_QUALIFIED" as const] : []),
    ...(has(failures, "OBJECTIVE_SCOPE_EXPANDED") ? ["OBJECTIVE_SCOPE_EXPANDED" as const] : []),
    ...(has(failures, "AMBIGUOUS_OBJECTIVE_ACCEPTED") ? ["AMBIGUOUS_OBJECTIVE_ACCEPTED" as const] : []),
    ...(goal_graph.cycles_detected.length ? ["GOAL_GRAPH_CYCLE" as const] : []),
    ...(goal_graph.orphan_goals.length ? ["ORPHAN_GOAL_ACTIONABLE" as const] : []),
    ...(!decomposition.child_constraints_at_least_as_restrictive ? ["DECOMPOSITION_WEAKENS_CONSTRAINTS" as const] : []),
    ...(decomposition.missing_capabilities.length ? ["UNAUTHORIZED_CAPABILITY_INSERTION" as const] : []),
    ...(candidate_plan.plan_steps.some((step) => !step.required_capability_ref) ? ["PLAN_STEP_MISSING_CAPABILITY" as const] : []),
    ...(!reasoning_pipeline.observable ? ["REASONING_PIPELINE_UNOBSERVABLE" as const] : []),
    ...(assumptions.some((assumption) => assumption.hidden || assumption.evidence_refs.length === 0) ? ["HIDDEN_ASSUMPTION" as const] : []),
    ...(!candidate_plan.uncertainty_summary ? ["UNCERTAINTY_NOT_PROPAGATED" as const] : []),
    ...(!recommendation.advisory_only ? ["RECOMMENDATION_NOT_ADVISORY" as const] : []),
    ...(!governance.authority_evaluated || !governance.approval_gates_present ? ["PLANNING_GOVERNANCE_BYPASS" as const] : []),
    ...(!governance.execution_attempt_blocked || governance.authority_laundering_detected ? ["EXECUTION_AUTHORITY_GRANTED" as const] : []),
    ...(!evidenceComplete || recommendation.supporting_evidence_refs.length === 0 ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(!governance.tenant_isolation_enforced ? ["TENANT_ISOLATION_VIOLATION" as const] : []),
    ...(!observability.complete_visibility ? ["OPERATOR_CONTROL_MISSING" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.5-PLANNING-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    qualified: outcome(derivedFailures) === "QUALIFIED",
    advisory_only: recommendation.advisory_only,
    objective_qualified: objectiveQualified,
    goal_graph_integrity: goal_graph.cycles_detected.length === 0 && goal_graph.orphan_goals.length === 0,
    decomposition_bounded: decomposition.recursion_bounded && decomposition.no_authority_expansion,
    capability_boundary_compliance: decomposition.missing_capabilities.length === 0 && candidate_plan.plan_steps.every((step) => Boolean(step.required_capability_ref)),
    reasoning_pipeline_integrity: reasoning_pipeline.observable && reasoning_pipeline.stage_order_deterministic,
    assumption_transparency: assumptions.every((assumption) => !assumption.hidden && assumption.evidence_refs.length > 0),
    uncertainty_propagated: Boolean(candidate_plan.uncertainty_summary),
    governance_enforced: governance.authority_evaluated && governance.fail_closed_validated,
    tenant_isolation_preserved: governance.tenant_isolation_enforced,
    evidence_complete: evidenceComplete,
    replay_satisfied: replay_validation.deterministic,
    operator_visibility: observability.complete_visibility,
    no_execution_authority: recommendation.advisory_only && candidate_plan.plan_steps.every((step) => step.execution_prohibited),
    failures: derivedFailures,
  });
  const base: Omit<PlanningReasoningResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    constitutional_ref: "P3.0-CAF-CONSTITUTION-001",
    memory_knowledge_ref: "caf-memory-knowledge/v3.4",
    objective,
    goal_graph,
    decomposition,
    reasoning_pipeline,
    candidate_plan,
    assumptions,
    recommendation,
    governance,
    evidence,
    replay_validation,
    observability,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePlanningReasoning(result?: PlanningReasoningResult): PlanningReasoningValidation {
  if (!result) return nested({ valid: false, outcome: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, objective_valid: false, graph_valid: false, plan_valid: false, governance_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const objective_valid = verifyHashedRecord(result.objective) && ["QUALIFIED", "QUALIFIED_WITH_CONSTRAINTS"].includes(result.objective.qualification_status) && result.objective.advisory_only && result.objective.evidence_refs.length > 0;
  const graph_valid = verifyHashedRecord(result.goal_graph) && result.goal_graph.cycles_detected.length === 0 && result.goal_graph.orphan_goals.length === 0 && result.goal_graph.reconstructable_from_evidence;
  const plan_valid = verifyHashedRecord(result.candidate_plan) && result.candidate_plan.advisory_only && result.candidate_plan.plan_steps.every((step) => verifyHashedRecord(step) && step.required_capability_ref && step.execution_prohibited);
  const governance_valid = verifyHashedRecord(result.governance) && result.governance.authority_evaluated && result.governance.execution_attempt_blocked && result.governance.tenant_isolation_enforced;
  const evidence_valid = result.evidence.length === 10 && result.evidence.every((entry) => verifyHashedRecord(entry) && entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && Boolean(entry.lineage_ref));
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "QUALIFIED" && result.certification.qualified;
  const valid = replay_hash_valid && integrity_hash_valid && objective_valid && graph_valid && plan_valid && governance_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, objective_valid, graph_valid, plan_valid, governance_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayPlanningReasoning(result = runPlanningReasoning()): boolean {
  const replayed = runPlanningReasoning();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePlanningReasoning(result).valid;
}

export function getPlanningReasoningBundle(): PlanningReasoningBundle {
  const result = runPlanningReasoning();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      authority_classification: "ADVISORY_ONLY" as const,
      execution_authority: "NONE" as const,
      consumes_memory_knowledge: true,
      qualified_objective_required: true,
      recommendation_is_not_authorization: true,
      deterministic_replay_required: true,
    }),
    result,
    validation: validatePlanningReasoning(result),
  });
}

export const PlanningReasoningService = Object.freeze({
  run: runPlanningReasoning,
  validate: validatePlanningReasoning,
  replay: replayPlanningReasoning,
});
