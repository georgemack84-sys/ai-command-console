import type { FailureAnalysisObject, FailureAnalysisScenario } from "@/types/failure-analysis-engine";
import type { RecoveryValidationStatus } from "@/types/recovery-contract";

export type RecoveryStrategyType =
  | "ROLLBACK"
  | "RESTART"
  | "CHECKPOINT_RECOVERY"
  | "STAGED_RECOVERY"
  | "DEPENDENCY_REPAIR"
  | "ALTERNATIVE_EXECUTION_PATH"
  | "PARTIAL_CONTINUATION";

export type RecoveryPlanLifecycleState = "PLANNED" | "VALIDATING" | "GOVERNANCE_REVIEW" | "READY_FOR_OPERATOR" | "APPROVED" | "REJECTED";
export type RecoveryPlanningConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type RecoveryPlanningRiskLevel = "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type RecoveryPlanningGovernanceStatus = "COMPLIANT" | "NON_COMPLIANT" | "BLOCKED";

export type RecoveryPlanningScenario =
  | FailureAnalysisScenario
  | "BASELINE"
  | "LOW_CONFIDENCE"
  | "REPLAY_MISMATCH"
  | "INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_FAILURE"
  | "AUTONOMOUS_EXECUTION_ATTEMPT"
  | "ROLLBACK_EXECUTION_ATTEMPT"
  | "RESTART_EXECUTION_ATTEMPT"
  | "CHECKPOINT_RESTORE_ATTEMPT"
  | "GOVERNANCE_MUTATION_ATTEMPT"
  | "AUTHORITY_ESCALATION_ATTEMPT"
  | "HIDDEN_ALTERNATIVES";

export type RecoveryPlanningFailure =
  | "STRATEGY_GENERATION_INVALID"
  | "PLAN_SCHEMA_INVALID"
  | "EVALUATION_INVALID"
  | "RANKING_INVALID"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "REPLAY_INVALID"
  | "LINEAGE_INVALID"
  | "INTEGRITY_INVALID"
  | "CONFIDENCE_INSUFFICIENT"
  | "TENANT_ISOLATION_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "AUTONOMOUS_EXECUTION_DETECTED"
  | "ROLLBACK_EXECUTION_DETECTED"
  | "RESTART_EXECUTION_DETECTED"
  | "CHECKPOINT_RESTORE_DETECTED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "HIDDEN_ALTERNATIVES_DETECTED";

export type RecoveryPlanEvaluation = Readonly<{
  evaluation_id: string;
  recovery_confidence: number;
  recovery_cost: number;
  governance_impact: RecoveryPlanningRiskLevel;
  replay_consistency: number;
  operational_risk: RecoveryPlanningRiskLevel;
  mission_preservation: number;
  dependency_stability: number;
  estimated_duration_minutes: number;
  evaluation_score: number;
  evaluation_hash: string;
}>;

export type RecoveryPlan = Readonly<{
  recovery_plan_id: string;
  recovery_id: string;
  strategy_type: RecoveryStrategyType;
  lifecycle_state: RecoveryPlanLifecycleState;
  failure_reference: string;
  objectives: readonly string[];
  recovery_steps: readonly string[];
  dependencies: readonly string[];
  rollback_reference: string | null;
  checkpoint_reference: string | null;
  governance_requirements: readonly string[];
  authority_requirements: readonly string[];
  confidence_score: number;
  confidence_level: RecoveryPlanningConfidenceLevel;
  operational_risk: RecoveryPlanningRiskLevel;
  estimated_duration: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  governance_validation: RecoveryValidationStatus;
  constitutional_validation: RecoveryValidationStatus;
  authority_validation: RecoveryValidationStatus;
  operator_approval_required: true;
  execution_authorized: false;
  evaluation: RecoveryPlanEvaluation;
  rank: number;
  plan_hash: string;
}>;

export type RecoveryPlanningReplayMetadata = Readonly<{
  replay_reference: string;
  replay_version: "recovery-planning-replay/v8ALT.2.3";
  recovery_inputs: string;
  planning_decisions: string;
  strategy_generation: string;
  dependency_analysis: string;
  confidence_calculations: string;
  governance_validation: string;
  authority_validation: string;
  evaluation_results: string;
  replay_checksum: string;
  replay_hash: string;
}>;

export type RecoveryPlanRepositoryEntry = Readonly<{
  repository_id: string;
  recovery_id: string;
  analysis_id: string;
  tenant_id: string;
  plan_ids: readonly string[];
  selected_plan_id: string;
  append_only: true;
  version: "recovery-plan-repository/v8ALT.2.3";
  lineage_reference: string;
  governance_evidence: readonly string[];
  authority_evidence: readonly string[];
  integrity_hash: string;
  repository_hash: string;
}>;

export type RecoveryPlanningPackage = Readonly<{
  planning_id: string;
  recovery_id: string;
  analysis_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  source_failure_analysis: FailureAnalysisObject;
  plans: readonly RecoveryPlan[];
  selected_plan: RecoveryPlan;
  ranking_factors: readonly string[];
  governance_status: RecoveryPlanningGovernanceStatus;
  constitutional_status: "COMPLIANT" | "VIOLATION" | "UNVERIFIED";
  authority_status: RecoveryValidationStatus;
  replay: RecoveryPlanningReplayMetadata;
  repository: RecoveryPlanRepositoryEntry;
  advisory_only: true;
  recovery_executed: boolean;
  rollback_performed: boolean;
  restart_performed: boolean;
  checkpoint_restored: boolean;
  governance_modified: boolean;
  authority_escalated: boolean;
  alternatives_hidden: boolean;
  package_hash: string;
}>;

export type RecoveryPlanningInput = Readonly<{
  scenario?: RecoveryPlanningScenario;
  failure_analysis?: FailureAnalysisObject;
  tenant_id?: string;
  mission_id?: string;
  execution_id?: string;
}>;

export type RecoveryPlanningValidationResult = Readonly<{
  planning_id: string | null;
  valid: boolean;
  strategies_complete: boolean;
  plans_valid: boolean;
  evaluations_valid: boolean;
  ranking_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  confidence_valid: boolean;
  tenant_isolated: boolean;
  operator_approval_required: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly RecoveryPlanningFailure[];
  validation_hash: string;
}>;

export type RecoveryPlanningReplayResult = Readonly<{
  replay_reference: string;
  planning_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_checksum: string;
  replay_result_hash: string;
}>;

export type RecoveryPlanningObservabilitySurface = Readonly<{
  planning_id: string;
  recovery_id: string;
  analysis_id: string;
  selected_strategy: RecoveryStrategyType;
  plan_count: number;
  selected_rank: number;
  selected_confidence: RecoveryPlanningConfidenceLevel;
  selected_risk: RecoveryPlanningRiskLevel;
  governance_status: RecoveryPlanningGovernanceStatus;
  authority_status: RecoveryValidationStatus;
  replay_valid: boolean;
  tenant_id: string;
  advisory_only: true;
  package_hash: string;
}>;

export type RecoveryPlanningEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "recovery-planning-engine/v8ALT.2.3";
    principles: readonly string[];
    strategy_types: readonly RecoveryStrategyType[];
    lifecycle_states: readonly RecoveryPlanLifecycleState[];
    confidence_levels: readonly RecoveryPlanningConfidenceLevel[];
    risk_levels: readonly RecoveryPlanningRiskLevel[];
    ranking_factors: readonly string[];
    advisory_only: true;
    operator_approval_required: true;
  }>;
  planning_package: RecoveryPlanningPackage;
  validation: RecoveryPlanningValidationResult;
  replay: RecoveryPlanningReplayResult;
  observability: RecoveryPlanningObservabilitySurface;
}>;
