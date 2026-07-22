export type ObjectiveQualificationStatus = "QUALIFIED" | "QUALIFIED_WITH_CONSTRAINTS" | "REQUIRES_CLARIFICATION" | "REQUIRES_OPERATOR_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW" | "REJECTED" | "PROHIBITED";
export type GoalNodeType = "PRIMARY_OBJECTIVE" | "SUPPORTING_OBJECTIVE" | "SUBGOAL" | "PREREQUISITE" | "DECISION_GATE" | "EVIDENCE_GATE" | "AUTHORITY_GATE" | "POLICY_GATE" | "REVIEW_GATE" | "VALIDATION_GOAL" | "RECOVERY_GOAL" | "ROLLBACK_GOAL" | "TERMINAL_GOAL";
export type PlanningLifecycleState = "OBJECTIVE_RECEIVED" | "OBJECTIVE_QUALIFYING" | "OBJECTIVE_QUALIFIED" | "OBJECTIVE_SYNTHESIZED" | "GOAL_GRAPH_CREATED" | "DECOMPOSITION_IN_PROGRESS" | "CANDIDATES_GENERATED" | "FEASIBILITY_EVALUATED" | "ALTERNATIVES_COMPARED" | "RECOMMENDATION_SYNTHESIZED" | "EVIDENCE_COMMITTED" | "AWAITING_REVIEW" | "RECOMMENDATION_RELEASED" | "COMPLETED";
export type PlanningQualificationOutcome = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED";

export type PlanningReasoningFailure =
  | "P3_4_MEMORY_KNOWLEDGE_INVALID"
  | "OBJECTIVE_NOT_QUALIFIED"
  | "OBJECTIVE_SCOPE_EXPANDED"
  | "AMBIGUOUS_OBJECTIVE_ACCEPTED"
  | "GOAL_GRAPH_CYCLE"
  | "ORPHAN_GOAL_ACTIONABLE"
  | "DECOMPOSITION_WEAKENS_CONSTRAINTS"
  | "UNAUTHORIZED_CAPABILITY_INSERTION"
  | "PLAN_STEP_MISSING_CAPABILITY"
  | "REASONING_PIPELINE_UNOBSERVABLE"
  | "HIDDEN_ASSUMPTION"
  | "UNCERTAINTY_NOT_PROPAGATED"
  | "RECOMMENDATION_NOT_ADVISORY"
  | "PLANNING_GOVERNANCE_BYPASS"
  | "EXECUTION_AUTHORITY_GRANTED"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_DIVERGENCE"
  | "TENANT_ISOLATION_VIOLATION"
  | "OPERATOR_CONTROL_MISSING"
  | "CERTIFICATION_PRUNED";

export type PlanningReasoningScenario = "BASELINE" | PlanningReasoningFailure;
export type PlanningReasoningInput = Readonly<{ scenario?: PlanningReasoningScenario; tenant_id?: string }>;

export type ObjectiveRecord = Readonly<{
  objective_id: string;
  objective_version: string;
  tenant_id: string;
  mission_scope: string;
  agent_id: string;
  source_type: "OPERATOR_INSTRUCTION" | "GOVERNANCE_DIRECTIVE" | "APPROVED_MISSION_OBJECTIVE" | "AUTHORIZED_WORKFLOW_REQUEST" | "PARENT_PLAN_DELEGATION" | "CERTIFIED_SYSTEM_EVENT";
  source_principal_id: string;
  objective_statement: string;
  desired_outcome: string;
  success_criteria: readonly string[];
  failure_criteria: readonly string[];
  constraints: readonly string[];
  assumptions: readonly string[];
  authority_requirements: readonly string[];
  capability_boundaries: readonly string[];
  qualification_status: ObjectiveQualificationStatus;
  advisory_only: true;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type GoalNodeRecord = Readonly<{
  goal_id: string;
  objective_id: string;
  goal_type: GoalNodeType;
  goal_statement: string;
  parent_goal_id: string | null;
  required_capabilities: readonly string[];
  required_evidence: readonly string[];
  authority_requirements: readonly string[];
  approval_requirements: readonly string[];
  lifecycle_status: "QUALIFIED" | "READY_FOR_PLANNING" | "PLANNED" | "BLOCKED";
  dependency_refs: readonly string[];
  conflict_refs: readonly string[];
  integrity_hash: string;
}>;

export type GoalGraphRecord = Readonly<{
  graph_id: string;
  objective_ref: string;
  nodes: readonly GoalNodeRecord[];
  edges: readonly string[];
  cycles_detected: readonly string[];
  orphan_goals: readonly string[];
  conflicting_goals: readonly string[];
  versioned: boolean;
  constraints_propagated: boolean;
  reconstructable_from_evidence: boolean;
  integrity_hash: string;
}>;

export type DecompositionRecord = Readonly<{
  decomposition_id: string;
  objective_ref: string;
  strategy_ref: string;
  outcome: "DECOMPOSED" | "PARTIALLY_DECOMPOSED" | "REQUIRES_INFORMATION" | "REQUIRES_CAPABILITY" | "REQUIRES_APPROVAL" | "INFEASIBLE" | "CONFLICTED" | "REJECTED";
  parent_child_lineage_complete: boolean;
  child_constraints_at_least_as_restrictive: boolean;
  missing_capabilities: readonly string[];
  recursion_bounded: boolean;
  no_authority_expansion: boolean;
  terminal_tasks_measurable: boolean;
  integrity_hash: string;
}>;

export type PlanStepRecord = Readonly<{
  step_id: string;
  plan_id: string;
  sequence_index: number;
  purpose: string;
  required_capability_ref: string;
  dependency_step_refs: readonly string[];
  constraints: readonly string[];
  evidence_requirements: readonly string[];
  authority_requirement: string;
  approval_requirement: string;
  risk_classification: "LOW" | "MEDIUM" | "HIGH";
  reversibility_classification: "REVERSIBLE" | "CONDITIONALLY_REVERSIBLE" | "IRREVERSIBLE";
  execution_prohibited: true;
  integrity_hash: string;
}>;

export type CandidatePlanRecord = Readonly<{
  plan_id: string;
  plan_version: string;
  objective_ref: string;
  goal_graph_ref: string;
  tenant_id: string;
  agent_id: string;
  planning_strategy: string;
  plan_steps: readonly PlanStepRecord[];
  feasibility_status: "FEASIBLE_WITH_APPROVAL" | "PARTIALLY_FEASIBLE" | "INFEASIBLE";
  assumption_refs: readonly string[];
  uncertainty_summary: string;
  risk_summary: string;
  approval_requirements: readonly string[];
  lifecycle_status: PlanningLifecycleState;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ReasoningPipelineRecord = Readonly<{
  pipeline_id: string;
  stages: readonly string[];
  stage_order_deterministic: boolean;
  interruption_supported: boolean;
  resumption_supported: boolean;
  observable: boolean;
  bounded_variability_declared: boolean;
  integrity_hash: string;
}>;

export type AssumptionRecord = Readonly<{
  assumption_id: string;
  plan_ref: string;
  assumption_statement: string;
  confidence: number;
  materiality: "LOW" | "MEDIUM" | "HIGH";
  validation_status: "VALIDATED" | "UNVALIDATED" | "EXPIRED";
  evidence_refs: readonly string[];
  hidden: boolean;
  integrity_hash: string;
}>;

export type PlanningRecommendationRecord = Readonly<{
  recommendation_id: string;
  objective_ref: string;
  selected_plan_ref: string;
  alternative_plan_refs: readonly string[];
  recommendation_summary: string;
  supporting_evidence_refs: readonly string[];
  assumption_refs: readonly string[];
  uncertainty_summary: string;
  confidence: number;
  required_approvals: readonly string[];
  prohibited_actions: readonly string[];
  unresolved_dependencies: readonly string[];
  recommendation_outcome: "RECOMMEND_WITH_REVIEW" | "NO_SAFE_RECOMMENDATION" | "REQUEST_CLARIFICATION" | "REQUIRE_GOVERNANCE_REVIEW";
  advisory_only: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type PlanningGovernanceRecord = Readonly<{
  governance_id: string;
  authority_evaluated: boolean;
  policy_compliance_validated: boolean;
  approval_gates_present: boolean;
  authority_laundering_detected: boolean;
  hidden_objective_expansion_detected: boolean;
  execution_attempt_blocked: boolean;
  tenant_isolation_enforced: boolean;
  fail_closed_validated: boolean;
  integrity_hash: string;
}>;

export type ReasoningEvidenceEntry = Readonly<{
  evidence_id: string;
  event_type: "OBJECTIVE_QUALIFIED" | "OBJECTIVE_SYNTHESIZED" | "GOAL_GRAPH_CREATED" | "DECOMPOSED" | "PIPELINE_EVALUATED" | "PLAN_GENERATED" | "ASSUMPTION_RECORDED" | "RECOMMENDATION_SYNTHESIZED" | "REPLAY_VALIDATED" | "CERTIFIED";
  evidence_refs: readonly string[];
  lineage_ref: string;
  sequence: number;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type PlanningReplayValidation = Readonly<{
  replay_validation_id: string;
  objective_replayed: boolean;
  goal_graph_replayed: boolean;
  decomposition_replayed: boolean;
  plan_replayed: boolean;
  recommendation_replayed: boolean;
  divergence_classification: "NONE" | "EXPECTED_VARIABILITY" | "UNEXPLAINED_DIVERGENCE" | "REPLAY_INCOMPLETE";
  deterministic: boolean;
  integrity_hash: string;
}>;

export type PlanningObservabilityRecord = Readonly<{
  observability_id: string;
  metrics: Readonly<{
    objectives_received: number;
    objectives_qualified: number;
    objectives_rejected: number;
    candidate_plans_generated: number;
    recommendation_rate: number;
    operator_review_rate: number;
    replay_match_rate: number;
    unexplained_divergence_count: number;
    planning_violation_count: number;
    fail_closed_event_count: number;
  }>;
  operator_controls: readonly string[];
  complete_visibility: boolean;
  integrity_hash: string;
}>;

export type PlanningCertification = Readonly<{
  certification_id: string;
  outcome: PlanningQualificationOutcome;
  qualified: boolean;
  advisory_only: boolean;
  objective_qualified: boolean;
  goal_graph_integrity: boolean;
  decomposition_bounded: boolean;
  capability_boundary_compliance: boolean;
  reasoning_pipeline_integrity: boolean;
  assumption_transparency: boolean;
  uncertainty_propagated: boolean;
  governance_enforced: boolean;
  tenant_isolation_preserved: boolean;
  evidence_complete: boolean;
  replay_satisfied: boolean;
  operator_visibility: boolean;
  no_execution_authority: boolean;
  failures: readonly PlanningReasoningFailure[];
  integrity_hash: string;
}>;

export type PlanningReasoningResult = Readonly<{
  phase_version: "caf-planning-reasoning/v3.5";
  phase_identifier: "CafPlanningReasoning";
  constitutional_ref: "P3.0-CAF-CONSTITUTION-001";
  memory_knowledge_ref: "caf-memory-knowledge/v3.4";
  objective: ObjectiveRecord;
  goal_graph: GoalGraphRecord;
  decomposition: DecompositionRecord;
  reasoning_pipeline: ReasoningPipelineRecord;
  candidate_plan: CandidatePlanRecord;
  assumptions: readonly AssumptionRecord[];
  recommendation: PlanningRecommendationRecord;
  governance: PlanningGovernanceRecord;
  evidence: readonly ReasoningEvidenceEntry[];
  replay_validation: PlanningReplayValidation;
  observability: PlanningObservabilityRecord;
  certification: PlanningCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PlanningReasoningValidation = Readonly<{
  valid: boolean;
  outcome: PlanningQualificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  objective_valid: boolean;
  graph_valid: boolean;
  plan_valid: boolean;
  governance_valid: boolean;
  evidence_valid: boolean;
  certification_valid: boolean;
  failures: readonly PlanningReasoningFailure[];
  integrity_hash: string;
}>;

export type PlanningReasoningBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-planning-reasoning/v3.5";
    authority_classification: "ADVISORY_ONLY";
    execution_authority: "NONE";
    consumes_memory_knowledge: true;
    qualified_objective_required: true;
    recommendation_is_not_authorization: true;
    deterministic_replay_required: true;
  }>;
  result: PlanningReasoningResult;
  validation: PlanningReasoningValidation;
}>;
