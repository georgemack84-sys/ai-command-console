import type { AgentIdentity, AgentRole, AuthorityCategory } from "@/types/multi-agent-coordination-contract";

export type PlanningState = "INITIALIZING" | "OBJECTIVE_VALIDATION" | "PLAN_GENERATION" | "DEPENDENCY_ALIGNMENT" | "SEQUENCE_VALIDATION" | "CONSTRAINT_VALIDATION" | "CONFLICT_ANALYSIS" | "SYNCHRONIZED" | "REPLAY_READY" | "CERTIFIED" | "FAILED";
export type DependencyType = "TASK" | "RESOURCE" | "DATA" | "SERVICE" | "MISSION" | "AUTHORITY" | "POLICY" | "GOVERNANCE" | "CONSTITUTION";
export type ConstraintCategory = "Mission" | "Resource" | "Authority" | "Governance" | "Constitution" | "Security" | "Runtime" | "Risk" | "Confidence" | "Time" | "Tenant";
export type PlanningGraphNodeType = "plan_node" | "dependency_node" | "constraint_node" | "decision_node" | "authority_node" | "governance_node" | "execution_node" | "checkpoint_node";
export type DivergenceCategory = "OBJECTIVE" | "DEPENDENCY" | "SEQUENCE" | "RESOURCE" | "AUTHORITY" | "GOVERNANCE" | "CONSTRAINT" | "EXECUTION";
export type PlanningScenario = "BASELINE" | "OBJECTIVE_MISMATCH" | "NONDETERMINISTIC_PLAN" | "MISSING_DEPENDENCY" | "DEPENDENCY_ORDER_MISMATCH" | "INCOMPATIBLE_TASK_ORDER" | "CONSTRAINT_MISMATCH" | "GRAPH_CYCLE" | "CONFLICTING_OBJECTIVES" | "DUPLICATE_TASK_OWNERSHIP" | "PLAN_DIVERGENCE" | "GOVERNANCE_MISMATCH" | "AUTHORITY_OVERLAP" | "CONSTITUTIONAL_MISMATCH" | "REPLAY_MISMATCH" | "INTEGRITY_FAILURE" | "CROSS_TENANT_PLANNING" | "HIDDEN_PLANNING_ACTIVITY";
export type PlanningFailure = "OBJECTIVE_INTERPRETATION_MISMATCH" | "PLAN_GENERATION_NONDETERMINISTIC" | "MISSING_DEPENDENCY_DETECTED" | "DEPENDENCY_ORDERING_MISMATCH" | "INCOMPATIBLE_TASK_ORDER_DETECTED" | "CONSTRAINT_MISMATCH_DETECTED" | "PLANNING_GRAPH_CYCLE_DETECTED" | "CONFLICTING_OBJECTIVES_DETECTED" | "DUPLICATE_TASK_OWNERSHIP_DETECTED" | "PLAN_DIVERGENCE_DETECTED" | "GOVERNANCE_MISMATCH_DETECTED" | "AUTHORITY_OVERLAP_DETECTED" | "CONSTITUTIONAL_MISMATCH_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "INTEGRITY_HASH_INVALID" | "CROSS_TENANT_PLANNING_DETECTED" | "HIDDEN_PLANNING_ACTIVITY_DETECTED";

export type SharedObjective = Readonly<{
  mission_id: string;
  objective_id: string;
  objective_description: string;
  success_criteria: readonly string[];
  priority: "LOW" | "NORMAL" | "HIGH" | "CERTIFICATION";
  constraints: readonly string[];
  authorized_resources: readonly string[];
  authorized_outputs: readonly string[];
  governance_context: string;
  constitutional_context: string;
}>;

export type AgentPlan = Readonly<{
  plan_id: string;
  coordination_session_id: string;
  agent_id: string;
  planning_version: "synchronized-planning/v8ALT.7.2";
  planning_timestamp: string;
  planning_state: PlanningState;
  planning_confidence: number;
  objective_interpretation_hash: string;
  execution_graph: readonly string[];
  dependency_graph: readonly string[];
  constraint_graph: readonly string[];
  governance_validation: "VALID" | "INVALID";
  integrity_hash: string;
}>;

export type PlanningGraphNode = Readonly<{
  graph_id: string;
  node_id: string;
  node_type: PlanningGraphNodeType;
  parent_node: string | null;
  dependency_nodes: readonly string[];
  execution_order: number;
  owner_agent: string;
  authority_scope: AuthorityCategory;
  constraint_reference: string;
  governance_reference: string;
  risk_score: number;
  confidence_score: number;
  status: "READY" | "BLOCKED" | "FAILED";
}>;

export type DependencyRecord = Readonly<{
  dependency_id: string;
  parent_task: string;
  dependent_task: string;
  dependency_type: DependencyType;
  validation_state: "VALID" | "MISSING" | "INVALID_ORDER";
  authority_reference: string;
  governance_reference: string;
  integrity_hash: string;
}>;

export type PlanningConflict = Readonly<{
  conflict_id: string;
  conflict_type: "OBJECTIVE" | "SEQUENCE" | "OWNERSHIP" | "DEPENDENCY" | "DIVERGENCE" | "AUTHORITY" | "GOVERNANCE" | "CONSTITUTION" | "TENANT" | "VISIBILITY" | "INTEGRITY";
  affected_agents: readonly string[];
  affected_tasks: readonly string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expected_order: readonly string[];
  observed_order: readonly string[];
  recommended_resolution: string;
  divergence_category?: DivergenceCategory;
}>;

export type PlanCompatibilityScore = Readonly<{
  compatibility_score: number;
  synchronization_score: number;
  conflict_score: number;
  risk_score: number;
  confidence_score: number;
  objective_agreement: number;
  dependency_agreement: number;
  sequencing_agreement: number;
  authority_agreement: number;
  governance_agreement: number;
  constraint_agreement: number;
  replay_agreement: number;
}>;

export type PlanningEvent = Readonly<{
  event_id: string;
  planning_session_id: string;
  agent_id: string;
  event_type: string;
  planning_state: PlanningState;
  previous_state: PlanningState;
  new_state: PlanningState;
  objective_reference: string;
  dependency_reference: string;
  governance_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type PlanningEvidence = Readonly<{
  planning_session_id: string;
  coordination_session_id: string;
  mission_id: string;
  agent_ids: readonly string[];
  objective_evidence: readonly string[];
  dependency_evidence: readonly string[];
  sequence_evidence: readonly string[];
  constraint_evidence: readonly string[];
  governance_evidence: readonly string[];
  authority_evidence: readonly string[];
  conflict_analysis: readonly PlanningConflict[];
  compatibility_score: PlanCompatibilityScore;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type PlanningContract = Readonly<{
  planning_contract_id: string;
  planning_session_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  participating_agents: readonly AgentIdentity[];
  shared_objective: SharedObjective;
  planning_constraints: readonly ConstraintCategory[];
  agent_plans: readonly AgentPlan[];
  dependency_graph: readonly DependencyRecord[];
  execution_graph: readonly PlanningGraphNode[];
  governance_reference: string;
  constitutional_reference: string;
  authority_reference: string;
  planning_version: "synchronized-planning-assurance/v8ALT.7.2";
  planning_state: PlanningState;
  lifecycle_events: readonly PlanningEvent[];
  evidence: PlanningEvidence;
  created_timestamp: string;
  immutable: true;
  append_only: true;
  operator_visible: boolean;
  integrity_hash: string;
  contract_hash: string;
}>;

export type PlanningInput = Readonly<{
  scenario?: PlanningScenario;
  tenant_id?: string;
  mission_id?: string;
  contract?: PlanningContract;
}>;

export type PlanningValidationResult = Readonly<{
  planning_contract_id: string | null;
  valid: boolean;
  objective_valid: boolean;
  plan_generation_deterministic: boolean;
  dependency_alignment_valid: boolean;
  sequencing_valid: boolean;
  constraint_awareness_valid: boolean;
  graph_valid: boolean;
  conflict_free: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  constitutional_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly PlanningFailure[];
  validation_hash: string;
}>;

export type PlanningReplayResult = Readonly<{
  replay_reference: string;
  planning_contract_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type PlanningObservabilitySurface = Readonly<{
  planning_contract_id: string;
  planning_session_id: string;
  tenant_id: string;
  mission_id: string;
  participating_agent_count: number;
  graph_node_count: number;
  dependency_count: number;
  conflict_count: number;
  state: PlanningState;
  compatibility_score: number;
  contract_hash: string;
}>;

export type SynchronizedPlanningAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "synchronized-planning-assurance/v8ALT.7.2";
    final_state: "SYNCHRONIZED_PLANNING_ASSURANCE_CERTIFIED";
    states: readonly PlanningState[];
    dependency_types: readonly DependencyType[];
    constraint_categories: readonly ConstraintCategory[];
    principles: readonly string[];
  }>;
  contract: PlanningContract;
  validation: PlanningValidationResult;
  replay: PlanningReplayResult;
  observability: PlanningObservabilitySurface;
}>;
