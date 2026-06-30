import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { DependencyGraphPackage } from "@/types/dependency-analysis";
import type { OptimizedPlanPackage } from "@/types/planning-optimization";
import type { AlternativePlanningPackage } from "@/types/alternative-planning";

export type ContingencyCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type FailureCategory = "PARTIAL_FAILURE" | "DEPENDENCY_FAILURE" | "GOVERNANCE_FAILURE" | "AUTHORITY_LOSS" | "ENVIRONMENTAL_CHANGE" | "MULTIPLE_FAILURES";
export type RecoveryStrategyType = "ROLLBACK" | "RETRY" | "OPERATOR_INTERVENTION" | "SAFE_STOP" | "DEGRADED_EXECUTION";
export type RecoveryPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ContingencyPlanningScenario =
  | "BASELINE"
  | "UNCERTIFIED_OPTIMIZED_PLAN"
  | "UNCERTIFIED_ALTERNATIVE_PACKAGE"
  | "MISSING_RECOVERY_METADATA"
  | "MISSING_GOVERNANCE"
  | "INVALID_REPLAY_REFERENCE"
  | "INCONSISTENT_PLANNING_STATE"
  | "MISSING_ROLLBACK"
  | "MISSING_RETRY"
  | "MISSING_OPERATOR_INTERVENTION"
  | "MISSING_SAFE_STOP"
  | "MISSING_DEGRADED_EXECUTION"
  | "ROLLBACK_IMPOSSIBLE"
  | "UNSAFE_RETRY"
  | "INCOMPLETE_OPERATOR_GUIDANCE"
  | "SAFE_STOP_STATE_LOSS"
  | "DEGRADED_GOVERNANCE_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "REPLAY_DIVERGENCE"
  | "EVIDENCE_CHAIN_BROKEN"
  | "TENANT_VIOLATION"
  | "HIDDEN_RECOVERY_LOGIC"
  | "UNRECOVERABLE_STATE"
  | "CONDITIONAL_REPORTING_GAP";

export type ContingencyFailureReason =
  | "UNCERTIFIED_OPTIMIZED_PLAN"
  | "UNCERTIFIED_ALTERNATIVE_PACKAGE"
  | "INCOMPLETE_RECOVERY_METADATA"
  | "MISSING_GOVERNANCE_CONSTRAINTS"
  | "INVALID_REPLAY_REFERENCE"
  | "INCONSISTENT_PLANNING_STATE"
  | "RECOVERY_STRATEGY_MISSING"
  | "ROLLBACK_PATH_UNAVAILABLE"
  | "UNSAFE_RETRY_CONDITIONS"
  | "OPERATOR_GUIDANCE_INCOMPLETE"
  | "SAFE_STOP_STATE_PRESERVATION_FAILED"
  | "DEGRADED_EXECUTION_GOVERNANCE_VIOLATION"
  | "GOVERNANCE_VIOLATION"
  | "POLICY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "AUTHORITY_VALIDATION_FAILED"
  | "TENANT_ISOLATION_VIOLATION"
  | "REPLAY_DIVERGENCE"
  | "NONDETERMINISTIC_RECOVERY"
  | "MISSING_EVIDENCE"
  | "BROKEN_LINEAGE"
  | "RATIONALE_INCOMPLETE"
  | "AMBIGUOUS_RECOMMENDATION"
  | "HIDDEN_RECOVERY_LOGIC"
  | "UNRECOVERABLE_EXECUTION_STATE"
  | "REPORTING_GAP"
  | "INTEGRITY_HASH_MISMATCH";

export type ContingencyPlanningIntake = Readonly<{
  contingency_intake_id: string;
  optimized_plan_id: string;
  alternative_package_id: string;
  dependency_graph_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  optimized_plan: OptimizedPlanPackage;
  alternative_package: AlternativePlanningPackage;
  dependency_graph: DependencyGraphPackage;
  governance_constraints: readonly string[];
  authority_requirements: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  recovery_metadata_complete: boolean;
  intake_failures: readonly ContingencyFailureReason[];
  intake_hash: string;
}>;

export type FailureScenario = Readonly<{
  failure_scenario_id: string;
  failure_category: FailureCategory;
  likely_failure_points: readonly string[];
  impact_assessment: RecoveryPriority;
  recovery_priority: RecoveryPriority;
  recommended_strategies: readonly RecoveryStrategyType[];
  governance_context: readonly string[];
  evidence_refs: readonly string[];
}>;

export type ContingencyPlan = Readonly<{
  contingency_plan_id: string;
  strategy_type: RecoveryStrategyType;
  failure_category: FailureCategory;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  trigger_conditions: readonly string[];
  recovery_workflow: readonly string[];
  rollback_reference: string | null;
  retry_conditions: readonly string[];
  operator_actions: readonly string[];
  safe_stop_sequence: readonly string[];
  degraded_execution_profile: readonly string[];
  required_authority: readonly string[];
  governance_requirements: readonly string[];
  estimated_recovery_time: string;
  supporting_evidence: readonly string[];
  rationale: string;
  confidence_score: number;
  replay_reference: string;
  lineage_reference: string;
  hidden_recovery_logic: boolean;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type RecoveryDecisionMatrixRow = Readonly<{
  failure_category: FailureCategory;
  recommended_recovery: readonly RecoveryStrategyType[];
  decision_rationale: string;
  recovery_priority: RecoveryPriority;
}>;

export type RecoveryEvidencePackage = Readonly<{
  evidence_package_id: string;
  plan_id: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
}>;

export type ContingencyPlanningPackage = Readonly<{
  contingency_package_id: string;
  optimized_plan_id: string;
  alternative_package_id: string;
  objective_id: string;
  mission_id: string;
  tenant_id: string;
  failure_scenarios: readonly FailureScenario[];
  recovery_plans: readonly ContingencyPlan[];
  decision_matrix: readonly RecoveryDecisionMatrixRow[];
  evidence_packages: readonly RecoveryEvidencePackage[];
  certification_state: ContingencyCertificationState;
  failure_reasons: readonly ContingencyFailureReason[];
  advisory_only: true;
  recovery_initiated: false;
  selected_recovery_plan_id: null;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type ContingencyValidationResult = Readonly<{
  validation_id: string;
  contingency_package_id: string;
  certification_state: ContingencyCertificationState;
  failures: readonly ContingencyFailureReason[];
  rollback_plan_generated: boolean;
  retry_plan_generated: boolean;
  operator_intervention_plan_generated: boolean;
  safe_stop_plan_generated: boolean;
  degraded_execution_plan_generated: boolean;
  failure_scenarios_analyzed: boolean;
  governance_compliance_preserved: boolean;
  replay_determinism_verified: boolean;
  authority_boundaries_preserved: boolean;
  tenant_isolation_enforced: boolean;
  evidence_chain_preserved: boolean;
  advisory_only_enforced: boolean;
  ready_for_planning_confidence: boolean;
  validation_hash: string;
}>;

export type ContingencyReplayResult = Readonly<{
  replay_id: string;
  contingency_package_id: string;
  replay_plan_order: readonly RecoveryStrategyType[];
  replay_scenario_order: readonly FailureCategory[];
  replay_evidence_refs: readonly string[];
  validation_state: ContingencyCertificationState;
  failure_reason: ContingencyFailureReason | null;
  replay_hash: string;
}>;

export type ContingencyVisibilitySurface = Readonly<{
  contingency_package_id: string;
  certification_state: ContingencyCertificationState;
  failure_categories: readonly FailureCategory[];
  recovery_strategies: readonly RecoveryStrategyType[];
  decision_matrix_entries: readonly string[];
  failure_reasons: readonly ContingencyFailureReason[];
  advisory_only: true;
  recovery_initiated: false;
  selected_recovery_plan_id: null;
  integrity_status: "VALID" | "INVALID";
  hidden_recovery_logic_visible: false;
}>;

export type ContingencyPlanningFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  intake: ContingencyPlanningIntake;
  package: ContingencyPlanningPackage;
  validation: ContingencyValidationResult;
  replay: ContingencyReplayResult;
  visibility: ContingencyVisibilitySurface;
}>;
