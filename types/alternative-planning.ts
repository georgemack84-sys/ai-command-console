import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type {
  GovernanceCheckpoint,
  OptimizationCertificationState,
  OptimizedExecutionStep,
  OptimizedParallelGroup,
  OptimizedPlanPackage,
  ResourceAllocation,
} from "@/types/planning-optimization";

export type AlternativePlanningCertificationState = OptimizationCertificationState;
export type AlternativeStrategyType = "PREFERRED" | "CONSERVATIVE" | "LOW_RISK" | "HIGH_RELIABILITY" | "OPERATOR_CONTROLLED";
export type AlternativeDimensionRating = "LOWEST" | "VERY_LOW" | "LOW" | "MEDIUM" | "MODERATE" | "HIGH" | "VERY_HIGH" | "HIGHEST" | "BALANCED";

export type AlternativePlanningScenario =
  | "BASELINE"
  | "UNCERTIFIED_OPTIMIZED_PLAN"
  | "MISSING_METADATA"
  | "INVALID_REPLAY_REFERENCE"
  | "MISSING_GOVERNANCE"
  | "INCONSISTENT_LINEAGE"
  | "MISSING_STRATEGY"
  | "DUPLICATE_STRATEGY"
  | "UNSUPPORTED_STRATEGY"
  | "GOVERNANCE_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "REPLAY_DIVERGENCE"
  | "RATIONALE_INCOMPLETE"
  | "TRADEOFFS_UNDOCUMENTED"
  | "EVIDENCE_MISSING"
  | "TENANT_VIOLATION"
  | "HIDDEN_EXECUTION_PATH"
  | "CONDITIONAL_DOCUMENTATION_GAP";

export type AlternativePlanningFailureReason =
  | "UNCERTIFIED_OPTIMIZED_PLAN"
  | "INCOMPLETE_PLANNING_METADATA"
  | "INVALID_REPLAY_REFERENCE"
  | "MISSING_GOVERNANCE_CONSTRAINTS"
  | "INCONSISTENT_LINEAGE"
  | "REQUIRED_STRATEGY_MISSING"
  | "DUPLICATE_STRATEGY"
  | "UNSUPPORTED_STRATEGY"
  | "GOVERNANCE_VIOLATION"
  | "POLICY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "TENANT_ISOLATION_VIOLATION"
  | "REPLAY_DIVERGENCE"
  | "UNSTABLE_ORDERING"
  | "MISSING_EVIDENCE"
  | "INCONSISTENT_COMPARISON"
  | "RATIONALE_INCOMPLETE"
  | "TRADEOFFS_UNDOCUMENTED"
  | "HIDDEN_EXECUTION_PATH"
  | "OPERATOR_VISIBILITY_REDUCED"
  | "DOCUMENTATION_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type AlternativePlanningIntake = Readonly<{
  alternative_intake_id: string;
  optimized_plan_id: string;
  dependency_graph_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  optimized_plan: OptimizedPlanPackage;
  dependency_graph: DependencyGraphPackage;
  governance_constraints: readonly string[];
  authority_requirements: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  intake_valid: boolean;
  intake_failures: readonly AlternativePlanningFailureReason[];
  intake_hash: string;
}>;

export type AlternativePlanningConstraint = Readonly<{
  constraint_id: string;
  name: string;
  required: boolean;
  satisfied: boolean;
  failure_reason: AlternativePlanningFailureReason | null;
}>;

export type AlternativeRiskProfile = Readonly<{
  operational_risk: AlternativeDimensionRating;
  mission_risk: AlternativeDimensionRating;
  governance_risk: AlternativeDimensionRating;
  replay_risk: AlternativeDimensionRating;
}>;

export type AlternativeReliabilityProfile = Readonly<{
  reliability: AlternativeDimensionRating;
  recovery_readiness: AlternativeDimensionRating;
  fault_tolerance: AlternativeDimensionRating;
}>;

export type AlternativePlan = Readonly<{
  alternative_plan_id: string;
  strategy_type: AlternativeStrategyType;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  description: string;
  execution_plan: string;
  execution_order: readonly OptimizedExecutionStep[];
  parallel_groups: readonly OptimizedParallelGroup[];
  resource_plan: readonly ResourceAllocation[];
  governance_checkpoints: readonly GovernanceCheckpoint[];
  authority_requirements: readonly string[];
  risk_profile: AlternativeRiskProfile;
  reliability_profile: AlternativeReliabilityProfile;
  operator_checkpoints: readonly string[];
  estimated_duration: string;
  resource_consumption: AlternativeDimensionRating;
  advantages: readonly string[];
  tradeoffs: readonly string[];
  selection_guidance: string;
  rationale: string;
  supporting_evidence: readonly string[];
  confidence_score: number;
  replay_reference: string;
  lineage_reference: string;
  hidden_execution_paths: boolean;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type AlternativeComparisonRow = Readonly<{
  dimension: string;
  preferred: AlternativeDimensionRating;
  conservative: AlternativeDimensionRating;
  low_risk: AlternativeDimensionRating;
  high_reliability: AlternativeDimensionRating;
  operator_controlled: AlternativeDimensionRating;
}>;

export type AlternativeTradeoffAnalysis = Readonly<{
  strategy_type: AlternativeStrategyType;
  execution_duration: AlternativeDimensionRating;
  resource_consumption: AlternativeDimensionRating;
  governance_overhead: AlternativeDimensionRating;
  operator_workload: AlternativeDimensionRating;
  mission_risk: AlternativeDimensionRating;
  resilience: AlternativeDimensionRating;
  replay_complexity: AlternativeDimensionRating;
  implementation_complexity: AlternativeDimensionRating;
}>;

export type AlternativeRecommendationEvidence = Readonly<{
  evidence_id: string;
  strategy_type: AlternativeStrategyType;
  why_generated: string;
  when_to_select: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type AlternativePlanningPackage = Readonly<{
  alternative_package_id: string;
  optimized_plan_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  preferred_plan_id: string;
  alternatives: readonly AlternativePlan[];
  comparison_matrix: readonly AlternativeComparisonRow[];
  tradeoff_analysis: readonly AlternativeTradeoffAnalysis[];
  recommendation_evidence: readonly AlternativeRecommendationEvidence[];
  certification_state: AlternativePlanningCertificationState;
  failure_reasons: readonly AlternativePlanningFailureReason[];
  advisory_only: true;
  selected_plan_id: null;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type AlternativePlanningValidationResult = Readonly<{
  validation_id: string;
  alternative_package_id: string;
  certification_state: AlternativePlanningCertificationState;
  failures: readonly AlternativePlanningFailureReason[];
  all_standard_alternatives_generated: boolean;
  governance_compliance_preserved: boolean;
  authority_boundaries_preserved: boolean;
  tenant_isolation_enforced: boolean;
  deterministic_replay_verified: boolean;
  rationale_complete: boolean;
  tradeoffs_documented: boolean;
  comparison_matrix_generated: boolean;
  recommendation_evidence_complete: boolean;
  advisory_only_enforced: boolean;
  ready_for_contingency_planning: boolean;
  validation_hash: string;
}>;

export type AlternativePlanningReplayResult = Readonly<{
  replay_id: string;
  alternative_package_id: string;
  replay_strategy_order: readonly AlternativeStrategyType[];
  replay_plan_ids: readonly string[];
  replay_evidence_refs: readonly string[];
  validation_state: AlternativePlanningCertificationState;
  failure_reason: AlternativePlanningFailureReason | null;
  replay_hash: string;
}>;

export type AlternativePlanningVisibilitySurface = Readonly<{
  alternative_package_id: string;
  certification_state: AlternativePlanningCertificationState;
  strategies: readonly AlternativeStrategyType[];
  preferred_plan_id: string;
  comparison_dimensions: readonly string[];
  tradeoff_strategies: readonly AlternativeStrategyType[];
  rationale_status: "COMPLETE" | "INCOMPLETE";
  failure_reasons: readonly AlternativePlanningFailureReason[];
  advisory_only: true;
  selected_plan_id: null;
  integrity_status: "VALID" | "INVALID";
  hidden_execution_paths_visible: false;
}>;

export type AlternativePlanningFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  intake: AlternativePlanningIntake;
  constraints: readonly AlternativePlanningConstraint[];
  package: AlternativePlanningPackage;
  validation: AlternativePlanningValidationResult;
  replay: AlternativePlanningReplayResult;
  visibility: AlternativePlanningVisibilitySurface;
}>;
