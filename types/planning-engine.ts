export type PlanningEngineDecision = "PLANNING_ENGINE_QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type PlanningEngineFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "W2_3_CAPABILITY_REGISTRY_INVALID"
  | "W2_4_SKILL_REGISTRY_INVALID"
  | "W2_5_AUTHORITY_VALIDATOR_INVALID"
  | "W2_6_POLICY_GATE_INVALID"
  | "W2_7_SAFETY_GATE_INVALID"
  | "GOAL_DECOMPOSITION_ENGINE_MISSING"
  | "GOAL_DECOMPOSITION_NON_DETERMINISTIC"
  | "GOAL_LINEAGE_MISSING"
  | "GOAL_DEPENDENCIES_INVALID"
  | "PLANNING_GRAPH_ENGINE_MISSING"
  | "PLANNING_GRAPH_CYCLE_ALLOWED"
  | "DEPENDENCY_ORDERING_INVALID"
  | "PLAN_GENERATION_ENGINE_MISSING"
  | "PLAN_GENERATION_NON_DETERMINISTIC"
  | "NO_EXECUTABLE_PLAN_PRODUCED"
  | "OPTIMIZATION_INCOMPLETE"
  | "CONSTRAINT_RESOLUTION_ENGINE_MISSING"
  | "CONSTITUTIONAL_CONSTRAINT_VIOLATION_ALLOWED"
  | "UNRESOLVED_CONFLICT_NOT_REPORTED"
  | "PLAN_REVIEW_FRAMEWORK_MISSING"
  | "PLAN_EXPLANATION_MISSING"
  | "REVIEW_EVIDENCE_MISSING"
  | "APPROVAL_POINT_ENGINE_MISSING"
  | "APPROVAL_WORKFLOW_NON_DETERMINISTIC"
  | "APPROVAL_BEFORE_EXECUTION_MISSING"
  | "APPROVAL_EVIDENCE_MISSING"
  | "PLAN_VALIDATION_ENGINE_MISSING"
  | "INVALID_PLAN_ACCEPTED"
  | "READINESS_DECISION_NON_DETERMINISTIC"
  | "PLAN_REGISTRY_MISSING"
  | "PLAN_HISTORY_MUTABLE"
  | "PLAN_LINEAGE_INCOMPLETE"
  | "REASONING_RUNTIME_CONTRACT_MISSING"
  | "REASONING_RUNTIME_CONTRACT_UNVERSIONED"
  | "REASONING_RUNTIME_CONTRACT_NOT_REPLAY_COMPATIBLE"
  | "PLANNING_EXECUTION_SEPARATION_BROKEN"
  | "PLANNING_EVIDENCE_MISSING"
  | "PLANNING_EVIDENCE_NOT_IMMUTABLE"
  | "PLANNING_REPLAY_INVALID"
  | "PLANNING_ENGINE_QUALIFICATION_FAILED";
export type PlanningEngineScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | PlanningEngineFailure;
export type PlanningEngineInput = Readonly<{ scenario?: PlanningEngineScenario; seed?: string }>;
export type GoalDecompositionEngine = Readonly<{ engine_id: string; goal_parser: boolean; objective_hierarchy: boolean; mission_graph: boolean; sub_goal_generation: boolean; task_tree_generation: boolean; goal_lineage: boolean; goal_priority: boolean; goal_dependencies: boolean; completion_criteria: boolean; deterministic_decomposition: boolean; repeatable_decomposition: boolean; integrity_hash: string }>;
export type PlanningGraphEngine = Readonly<{ engine_id: string; task_nodes: boolean; dependency_edges: boolean; parallel_groups: boolean; sequential_groups: boolean; conditional_branches: boolean; decision_nodes: boolean; merge_nodes: boolean; synchronization_points: boolean; dag_validated: boolean; cycles_prevented: boolean; dependency_ordering_verified: boolean; integrity_hash: string }>;
export type PlanGenerationEngine = Readonly<{ engine_id: string; task_ordering: boolean; capability_selection: boolean; skill_assignment: boolean; execution_sequencing: boolean; resource_planning: boolean; scheduling: boolean; alternative_plans: boolean; fallback_plans: boolean; recovery_plans: boolean; optimization: boolean; executable_plan: boolean; deterministic_generation: boolean; integrity_hash: string }>;
export type ConstraintResolutionEngine = Readonly<{ engine_id: string; capability_constraints: boolean; authority_constraints: boolean; policy_constraints: boolean; safety_constraints: boolean; lifecycle_constraints: boolean; resource_constraints: boolean; dependency_constraints: boolean; scheduling_constraints: boolean; tenant_constraints: boolean; environmental_constraints: boolean; unresolved_conflicts_reported: boolean; fail_closed: boolean; integrity_hash: string }>;
export type PlanReviewFramework = Readonly<{ framework_id: string; review_checkpoints: boolean; operator_review: boolean; governance_review: boolean; safety_review: boolean; authority_review: boolean; policy_review: boolean; risk_review: boolean; explanation_generation: boolean; decision_logging: boolean; reproducible_reviews: boolean; integrity_hash: string }>;
export type ApprovalPointEngine = Readonly<{ engine_id: string; approval_stages: boolean; approval_policies: boolean; required_approvers: boolean; multi_stage_approvals: boolean; conditional_approvals: boolean; emergency_approvals: boolean; expiration_rules: boolean; approval_lineage: boolean; deterministic_workflow: boolean; replayable_approvals: boolean; integrity_hash: string }>;
export type PlanValidationEngine = Readonly<{ engine_id: string; dependency_validation: boolean; capability_validation: boolean; authority_validation: boolean; policy_validation: boolean; safety_validation: boolean; lifecycle_validation: boolean; goal_completeness: boolean; execution_readiness: boolean; invalid_plan_rejection: boolean; deterministic_readiness: boolean; validation_evidence: boolean; integrity_hash: string }>;
export type PlanRegistry = Readonly<{ registry_id: string; plan_identity: boolean; plan_versions: boolean; plan_lineage: boolean; plan_ownership: boolean; plan_lifecycle: boolean; plan_metadata: boolean; execution_history: boolean; evidence_references: boolean; immutable_history: boolean; deterministic_lookup: boolean; complete_lineage: boolean; integrity_hash: string }>;
export type ReasoningRuntimeContract = Readonly<{ contract_id: string; planning_request_schema: boolean; planning_response_schema: boolean; execution_contract: boolean; constraint_contract: boolean; capability_contract: boolean; approval_contract: boolean; evidence_contract: boolean; replay_contract: boolean; failure_contract: boolean; versioned_contract: boolean; backward_compatible: boolean; replay_compatible: boolean; execution_separated: boolean; integrity_hash: string }>;
export type PlanningEvidenceFramework = Readonly<{ ledger_id: string; records: readonly string[]; planning_evidence: boolean; goal_evidence: boolean; constraint_evidence: boolean; approval_evidence: boolean; validation_evidence: boolean; review_evidence: boolean; optimization_evidence: boolean; replay_evidence: boolean; immutable: boolean; traceable: boolean; replay_complete: boolean; integrity_hash: string }>;
export type PlanningEngineReadiness = Readonly<{ readiness_id: string; decision: PlanningEngineDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; capability_registry_ready: boolean; skill_registry_ready: boolean; authority_validator_ready: boolean; policy_gate_ready: boolean; safety_gate_ready: boolean; goal_ready: boolean; graph_ready: boolean; plan_generation_ready: boolean; constraints_ready: boolean; review_ready: boolean; approval_ready: boolean; validation_ready: boolean; registry_ready: boolean; contract_ready: boolean; evidence_ready: boolean; execution_separated: boolean; approval_before_execution: boolean; failures: readonly PlanningEngineFailure[]; integrity_hash: string }>;
export type PlanningEngineResult = Readonly<{ phase_version: "planning-engine/w2.8"; phase_identifier: "PlanningEngine"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; capability_registry_ref: "capability-registry/w2.3"; skill_registry_ref: "skill-registry/w2.4"; authority_validator_ref: "authority-validator/w2.5"; policy_gate_ref: "policy-gate/w2.6"; safety_gate_ref: "safety-gate/w2.7"; goal_decomposition: GoalDecompositionEngine; planning_graph: PlanningGraphEngine; plan_generation: PlanGenerationEngine; constraints: ConstraintResolutionEngine; review: PlanReviewFramework; approvals: ApprovalPointEngine; validation_engine: PlanValidationEngine; registry: PlanRegistry; reasoning_runtime_contract: ReasoningRuntimeContract; evidence: PlanningEvidenceFramework; readiness: PlanningEngineReadiness; replay_hash: string; integrity_hash: string }>;
export type PlanningEngineValidation = Readonly<{ valid: boolean; decision: PlanningEngineDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; goal_valid: boolean; graph_valid: boolean; generation_valid: boolean; constraints_valid: boolean; review_valid: boolean; approvals_valid: boolean; validation_engine_valid: boolean; registry_valid: boolean; contract_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly PlanningEngineFailure[]; integrity_hash: string }>;
export type PlanningEngineBundle = Readonly<{ doctrine: Readonly<{ version: "planning-engine/w2.8"; owns_goal_decomposition: true; owns_planning_graphs: true; owns_plan_generation: true; owns_constraint_resolution: true; owns_plan_review: true; owns_approval_points: true; owns_plan_validation: true; owns_plan_registry: true; owns_reasoning_runtime_contract: true; owns_planning_evidence: true; separates_planning_from_execution: true; qualification_gate: "Planning Engine Qualification Gate" }>; result: PlanningEngineResult; validation: PlanningEngineValidation }>;
