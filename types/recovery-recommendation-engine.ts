import type { RecoveryValidationPackage, RecoveryValidationScenario } from "@/types/recovery-validation-engine";
import type { RecoveryPlanningConfidenceLevel, RecoveryPlanningRiskLevel } from "@/types/recovery-planning-engine";
import type { RecoveryValidationStatus } from "@/types/recovery-contract";

export type RecoveryRecommendationType = "RECOMMENDED_RECOVERY" | "RECOMMENDED_ROLLBACK" | "RECOMMENDED_RESTART" | "ALTERNATIVE_RECOVERY" | "OPERATOR_INTERVENTION_GUIDANCE";
export type RecoveryRecommendationLevel = "MONITOR" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RecoveryRecommendationScenario =
  | RecoveryValidationScenario
  | "BASELINE"
  | "MONITOR_LEVEL"
  | "LOW_LEVEL"
  | "MEDIUM_LEVEL"
  | "HIGH_LEVEL"
  | "CRITICAL_LEVEL"
  | "VALIDATION_REJECTED"
  | "REPLAY_MISMATCH"
  | "TENANT_ISOLATION_FAILURE"
  | "EXECUTION_ATTEMPT"
  | "RESTART_ATTEMPT"
  | "ROLLBACK_ATTEMPT"
  | "PLAN_MUTATION_ATTEMPT"
  | "GOVERNANCE_MUTATION_ATTEMPT"
  | "CONSTITUTIONAL_MUTATION_ATTEMPT"
  | "AUTHORITY_ESCALATION_ATTEMPT"
  | "APPROVAL_BYPASS"
  | "RISK_CONCEALMENT"
  | "CONFIDENCE_FABRICATION"
  | "ALTERNATIVE_SUPPRESSION";

export type RecoveryRecommendationFailure =
  | "VALIDATION_NOT_PASSED"
  | "RECOMMENDATION_SCHEMA_INVALID"
  | "RANKING_INVALID"
  | "CONFIDENCE_INVALID"
  | "RISK_INVALID"
  | "EXPLANATION_INVALID"
  | "OUTCOME_INVALID"
  | "GOVERNANCE_INVALID"
  | "AUTHORITY_INVALID"
  | "REPLAY_INVALID"
  | "LINEAGE_INVALID"
  | "INTEGRITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "OPERATOR_APPROVAL_INVALID"
  | "EXECUTION_DETECTED"
  | "RESTART_DETECTED"
  | "ROLLBACK_DETECTED"
  | "PLAN_MUTATION_DETECTED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "CONSTITUTIONAL_MUTATION_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "RISK_CONCEALMENT_DETECTED"
  | "CONFIDENCE_FABRICATION_DETECTED"
  | "ALTERNATIVE_SUPPRESSION_DETECTED";

export type RecommendationExpectedOutcome = Readonly<{
  mission_recovery_likelihood: number;
  execution_continuity: string;
  dependency_restoration: string;
  governance_impact: RecoveryPlanningRiskLevel;
  operational_disruption: RecoveryPlanningRiskLevel;
  estimated_recovery_duration: string;
  residual_risks: readonly string[];
  replay_consistency: number;
  outcome_hash: string;
}>;

export type RecommendationRiskAssessment = Readonly<{
  mission_risk: RecoveryPlanningRiskLevel;
  operational_disruption: RecoveryPlanningRiskLevel;
  governance_risk: RecoveryPlanningRiskLevel;
  authority_risk: RecoveryPlanningRiskLevel;
  dependency_risk: RecoveryPlanningRiskLevel;
  integrity_risk: RecoveryPlanningRiskLevel;
  recurrence_probability: number;
  recovery_complexity: RecoveryPlanningRiskLevel;
  risk_hash: string;
}>;

export type RecoveryRecommendationRecord = Readonly<{
  recommendation_id: string;
  recovery_plan_id: string;
  recovery_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  recommendation_type: RecoveryRecommendationType;
  recommendation_level: RecoveryRecommendationLevel;
  recommended_action: string;
  explanation: string;
  expected_outcome: RecommendationExpectedOutcome;
  confidence_score: number;
  confidence_level: RecoveryPlanningConfidenceLevel;
  recovery_risk: RecoveryPlanningRiskLevel;
  risk_assessment: RecommendationRiskAssessment;
  governance_status: RecoveryValidationStatus;
  authority_status: RecoveryValidationStatus;
  operator_approval_required: true;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
  rank: number;
  recommendation_hash: string;
}>;

export type OperatorRecommendationPackage = Readonly<{
  executive_summary: string;
  detected_failures: readonly string[];
  root_cause_analysis: string;
  recommended_recovery: RecoveryRecommendationRecord;
  alternative_recoveries: readonly RecoveryRecommendationRecord[];
  rollback_recommendation: RecoveryRecommendationRecord;
  restart_recommendation: RecoveryRecommendationRecord;
  operator_guidance: RecoveryRecommendationRecord;
  governance_evidence: readonly string[];
  authority_evidence: readonly string[];
  confidence_score: number;
  risk_assessment: RecommendationRiskAssessment;
  expected_outcome: RecommendationExpectedOutcome;
  replay_reference: string;
  lineage_reference: string;
  integrity_verification: string;
  package_hash: string;
}>;

export type RecoveryRecommendationReplayMetadata = Readonly<{
  replay_reference: string;
  replay_version: "recovery-recommendation-replay/v8ALT.2.5";
  recommendation_inputs: string;
  recovery_plans_evaluated: string;
  ranking_decisions: string;
  confidence_calculations: string;
  explanation_generation: string;
  governance_evidence: string;
  authority_evidence: string;
  predicted_outcomes: string;
  risk_calculations: string;
  replay_checksum: string;
  replay_hash: string;
}>;

export type RecoveryRecommendationLedgerEntry = Readonly<{
  ledger_id: string;
  package_id: string;
  validation_id: string;
  tenant_id: string;
  recommendation_ids: readonly string[];
  selected_recommendation_id: string;
  operator_approval_status: "REQUIRED" | "MISSING" | "BYPASSED";
  append_only: true;
  ledger_hash: string;
}>;

export type RecoveryRecommendationPackage = Readonly<{
  package_id: string;
  validation_package: RecoveryValidationPackage;
  recommendations: readonly RecoveryRecommendationRecord[];
  operator_package: OperatorRecommendationPackage;
  replay: RecoveryRecommendationReplayMetadata;
  ledger_entry: RecoveryRecommendationLedgerEntry;
  ready_for_recovery_replay_engine: boolean;
  advisory_only: true;
  recovery_executed: boolean;
  restart_performed: boolean;
  rollback_performed: boolean;
  recovery_plan_modified: boolean;
  governance_modified: boolean;
  constitutional_modified: boolean;
  authority_escalated: boolean;
  approval_bypassed: boolean;
  risks_concealed: boolean;
  confidence_fabricated: boolean;
  alternatives_suppressed: boolean;
  cross_tenant_exposed: boolean;
  package_hash: string;
}>;

export type RecoveryRecommendationInput = Readonly<{
  scenario?: RecoveryRecommendationScenario;
  validation_package?: RecoveryValidationPackage;
}>;

export type RecoveryRecommendationValidationResult = Readonly<{
  package_id: string | null;
  valid: boolean;
  validation_passed: boolean;
  recommendations_valid: boolean;
  ranking_valid: boolean;
  confidence_valid: boolean;
  risk_valid: boolean;
  explanations_valid: boolean;
  outcomes_valid: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  operator_approval_required: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly RecoveryRecommendationFailure[];
  validation_hash: string;
}>;

export type RecoveryRecommendationReplayResult = Readonly<{
  replay_reference: string;
  package_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_checksum: string;
  replay_result_hash: string;
}>;

export type RecoveryRecommendationObservabilitySurface = Readonly<{
  package_id: string;
  selected_recommendation_id: string;
  recommendation_level: RecoveryRecommendationLevel;
  recommendation_count: number;
  confidence_score: number;
  recovery_risk: RecoveryPlanningRiskLevel;
  ready_for_recovery_replay_engine: boolean;
  replay_valid: boolean;
  tenant_id: string;
  advisory_only: true;
  package_hash: string;
}>;

export type RecoveryRecommendationEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "recovery-recommendation-engine/v8ALT.2.5";
    principles: readonly string[];
    recommendation_types: readonly RecoveryRecommendationType[];
    recommendation_levels: readonly RecoveryRecommendationLevel[];
    confidence_levels: readonly RecoveryPlanningConfidenceLevel[];
    risk_levels: readonly RecoveryPlanningRiskLevel[];
    advisory_only: true;
    operator_approval_required: true;
  }>;
  recommendation_package: RecoveryRecommendationPackage;
  validation: RecoveryRecommendationValidationResult;
  replay_result: RecoveryRecommendationReplayResult;
  observability: RecoveryRecommendationObservabilitySurface;
}>;
