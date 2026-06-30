import type { ReplayContractPackage } from "@/types/replay-contract";

export type PlanningDecisionReconstructionOutcome = "VERIFIED" | "PARTIAL" | "MISMATCH" | "INVALID";
export type PlanningReplayStage = "OBJECTIVE" | "EVIDENCE_COLLECTION" | "CONSTRAINT_EVALUATION" | "ALTERNATIVE_GENERATION" | "RISK_ASSESSMENT" | "GOVERNANCE_REVIEW" | "AUTHORITY_VALIDATION" | "CONFIDENCE_CALCULATION" | "DECISION_SELECTION";
export type PlanningConfidenceLevel = "EXACT" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type PlanningDecisionReconstructionScenario =
  | "BASELINE"
  | "PLANNING_DIVERGENCE"
  | "DECISION_MISMATCH"
  | "MISSING_PLANNING_EVIDENCE"
  | "CONFIDENCE_MISMATCH"
  | "DELEGATION_INCONSISTENCY"
  | "AUTHORITY_MISMATCH"
  | "OPTIMIZATION_DIVERGENCE"
  | "FALLBACK_MISMATCH"
  | "GOVERNANCE_INCONSISTENCY"
  | "LINEAGE_BREAK"
  | "INTEGRITY_FAILURE"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_VIOLATION";

export type PlanningDecisionReconstructionFailure =
  | "PLANNING_DIVERGENCE"
  | "DECISION_MISMATCH"
  | "MISSING_PLANNING_EVIDENCE"
  | "CONFIDENCE_MISMATCH"
  | "DELEGATION_INCONSISTENCY"
  | "AUTHORITY_MISMATCH"
  | "OPTIMIZATION_DIVERGENCE"
  | "FALLBACK_MISMATCH"
  | "GOVERNANCE_INCONSISTENCY"
  | "LINEAGE_BREAK"
  | "INTEGRITY_FAILURE"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "TENANT_ISOLATION_VIOLATION";

export type PlanningReplayIdentity = Readonly<{
  planning_replay_id: string;
  tenant_id: string;
  mission_id: string;
  objective_id: string;
  plan_id: string;
  planning_session_id: string;
  planning_version: "planning-decision-reconstruction/v8G.3";
  decision_reference: string;
  delegation_reference: string;
  authority_reference: string;
  governance_reference: string;
  truth_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type ObjectiveReplayNode = Readonly<{
  objective_node_id: string;
  parent_objective_id: string | null;
  title: string;
  priority: number;
  constraints: readonly string[];
  dependencies: readonly string[];
  success_criteria: readonly string[];
  deterministic_sequence: number;
  integrity_hash: string;
}>;

export type AlternativePlanReplay = Readonly<{
  alternative_id: string;
  strategy: string;
  assumptions: readonly string[];
  dependencies: readonly string[];
  estimated_duration_ms: number;
  confidence_score: number;
  governance_constraints: readonly string[];
  constitutional_evaluation: "PASS" | "FAIL";
  advantages: readonly string[];
  tradeoffs: readonly string[];
  rejection_reason: string | null;
  integrity_hash: string;
}>;

export type PlanningReplay = Readonly<{
  planning_replay_id: string;
  planning_session_id: string;
  objective_hierarchy: readonly ObjectiveReplayNode[];
  planning_graph: readonly string[];
  selected_strategy: string;
  alternatives: readonly AlternativePlanReplay[];
  planning_assumptions: readonly string[];
  planning_constraints: readonly string[];
  confidence_score: number;
  confidence_level: PlanningConfidenceLevel;
  planning_hash: string;
}>;

export type DecisionReplay = Readonly<{
  decision_replay_id: string;
  decision_sequence: readonly PlanningReplayStage[];
  selected_plan_id: string;
  selected_strategy: string;
  evidence_chain: readonly string[];
  rejected_alternatives: readonly string[];
  tradeoff_analysis: readonly string[];
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  authority_influence: readonly string[];
  decision_confidence: number;
  decision_hash: string;
}>;

export type DelegationReplay = Readonly<{
  delegation_replay_id: string;
  delegated_tasks: readonly string[];
  delegation_targets: readonly string[];
  routing_decisions: readonly string[];
  authority_approvals: readonly string[];
  delegation_constraints: readonly string[];
  operator_approvals: readonly string[];
  delegation_outcomes: readonly string[];
  delegation_hash: string;
}>;

export type ReasoningReplay = Readonly<{
  reasoning_replay_id: string;
  reasoning_chain: readonly PlanningReplayStage[];
  evidence_chain: readonly string[];
  planning_assumptions: readonly string[];
  optimization_history: readonly string[];
  accepted_improvements: readonly string[];
  rejected_optimizations: readonly string[];
  fallback_evaluation: readonly string[];
  selected_fallback: string;
  confidence_inputs: readonly string[];
  confidence_calculation_hash: string;
  reasoning_hash: string;
}>;

export type PlanningDecisionValidation = Readonly<{
  validation_id: string;
  planning_replay_id: string;
  outcome: PlanningDecisionReconstructionOutcome;
  failures: readonly PlanningDecisionReconstructionFailure[];
  planning_reproducible: boolean;
  decision_reproducible: boolean;
  delegation_reproducible: boolean;
  confidence_reproducible: boolean;
  authority_validated: boolean;
  recommendation_consistent: boolean;
  optimization_consistent: boolean;
  fallback_consistent: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  lineage_preserved: boolean;
  governance_compliant: boolean;
  constitutionally_compliant: boolean;
  tenant_isolated: boolean;
  speculative_reasoning_generated: false;
  certification_ready: boolean;
  validation_hash: string;
}>;

export type PlanningDecisionReconstructionPackage = Readonly<{
  package_id: string;
  engine_version: "planning-decision-reconstruction/v8G.3";
  source_replay_contract: ReplayContractPackage;
  identity: PlanningReplayIdentity;
  planning_replay: PlanningReplay;
  decision_replay: DecisionReplay;
  delegation_replay: DelegationReplay;
  reasoning_replay: ReasoningReplay;
  validation: PlanningDecisionValidation;
  immutable: true;
  deterministic: true;
  speculative_reasoning_permitted: false;
  package_hash: string;
}>;

export type PlanningDecisionVisibilitySurface = Readonly<{
  planning_replay_id: string;
  objective_id: string;
  plan_id: string;
  outcome: PlanningDecisionReconstructionOutcome;
  failure_reasons: readonly PlanningDecisionReconstructionFailure[];
  objective_nodes: number;
  alternatives: number;
  selected_strategy: string;
  decision_steps: number;
  delegated_tasks: number;
  confidence_level: PlanningConfidenceLevel;
  integrity_status: "VALID" | "INVALID";
  certification_ready: boolean;
}>;

export type PlanningDecisionReconstructionFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "planning-decision-reconstruction/v8G.3";
    reasoning_chain: readonly PlanningReplayStage[];
    outcomes: readonly PlanningDecisionReconstructionOutcome[];
    confidence_levels: readonly PlanningConfidenceLevel[];
  }>;
  package: PlanningDecisionReconstructionPackage;
  visibility: PlanningDecisionVisibilitySurface;
}>;
