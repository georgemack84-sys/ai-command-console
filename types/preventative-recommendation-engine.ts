import type { RiskForecastingReport, RiskForecastScenario, RiskSeverityLevel } from "@/types/risk-forecasting-engine";

export type PreventativeRecommendationType =
  | "PREVENTATIVE_ACTION"
  | "MITIGATION_PLAN"
  | "CONTINGENCY_OPTION"
  | "RESOURCE_ADJUSTMENT"
  | "DEPENDENCY_OPTIMIZATION"
  | "EXECUTION_OPTIMIZATION"
  | "GOVERNANCE_REVIEW"
  | "OPERATOR_ADVISORY"
  | "RECOVERY_PREPARATION"
  | "SAFE_PAUSE"
  | "ESCALATION_PREPARATION";

export type PreventativeRecommendationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
export type PreventativePipelineState = "FORECAST_RECEIVED" | "RISK_ANALYSIS" | "OPTION_GENERATION" | "MITIGATION_PLANNING" | "CONTINGENCY_GENERATION" | "GOVERNANCE_VALIDATION" | "CONSTITUTIONAL_VALIDATION" | "EXPLAINABILITY_GENERATION" | "REPLAY_VALIDATION" | "READY_FOR_OPERATOR" | "REJECTED";
export type OperatorAdvisoryLevel = "INFORMATIONAL" | "LOW_PRIORITY" | "MEDIUM_PRIORITY" | "HIGH_PRIORITY" | "CRITICAL";

export type PreventativeRecommendationScenario =
  | RiskForecastScenario
  | "BASELINE"
  | "MISSING_EVIDENCE"
  | "MISSING_FORECAST_REFERENCE"
  | "MISSING_EXPLANATION"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_FAILURE"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "AUTONOMOUS_EXECUTION_ATTEMPT"
  | "AUTONOMOUS_MITIGATION_ATTEMPT"
  | "AUTONOMOUS_RECOVERY_ATTEMPT"
  | "GOVERNANCE_MODIFICATION_ATTEMPT"
  | "CONSTITUTIONAL_MODIFICATION_ATTEMPT"
  | "AUTHORITY_ESCALATION_ATTEMPT"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_RECOMMENDATION";

export type PreventativeRecommendationFailure =
  | "RECOMMENDATION_SCHEMA_INVALID"
  | "RECOMMENDATION_GENERATION_INVALID"
  | "MITIGATION_PLAN_INVALID"
  | "CONTINGENCY_OPTIONS_INVALID"
  | "OPERATOR_ADVISORY_INVALID"
  | "GOVERNANCE_ALTERNATIVES_INVALID"
  | "RECOVERY_PREPARATION_INVALID"
  | "PRIORITY_NONDETERMINISTIC"
  | "EVIDENCE_INCOMPLETE"
  | "FORECAST_REFERENCE_MISSING"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "EXPLANATION_INCOMPLETE"
  | "REPLAY_INVALID"
  | "LINEAGE_INVALID"
  | "INTEGRITY_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "ADVISORY_ONLY_VIOLATION"
  | "AUTONOMOUS_EXECUTION_DETECTED"
  | "AUTONOMOUS_MITIGATION_DETECTED"
  | "AUTONOMOUS_RECOVERY_DETECTED"
  | "GOVERNANCE_MODIFICATION_DETECTED"
  | "CONSTITUTIONAL_MODIFICATION_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "TENANT_ISOLATION_INVALID"
  | "CROSS_TENANT_RECOMMENDATION_DETECTED";

export type MitigationPlan = Readonly<{
  plan_id: string;
  objectives: readonly string[];
  implementation_sequence: readonly string[];
  required_approvals: readonly string[];
  governance_checkpoints: readonly string[];
  validation_requirements: readonly string[];
  rollback_considerations: readonly string[];
  expected_outcomes: readonly string[];
  plan_hash: string;
}>;

export type ContingencyOption = Readonly<{
  option_id: string;
  alternate_execution_path: string;
  degraded_operating_mode: string;
  dependency_workaround: string;
  scheduling_alternative: string;
  governance_escalation: string;
  safe_pause_recommendation: string;
  option_hash: string;
}>;

export type GovernanceAlternative = Readonly<{
  alternative_id: string;
  policy_compliance: "PASS" | "FAIL";
  authority_boundary: "PASS" | "FAIL";
  constitutional_requirement: "PASS" | "FAIL";
  certification_constraint: string;
  tenant_isolation: "PASS" | "FAIL";
  policy_impact_summary: string;
  approval_requirement: string;
  alternative_hash: string;
}>;

export type RecoveryPreparationPlan = Readonly<{
  preparation_id: string;
  rollback_readiness: number;
  restart_readiness: number;
  recovery_checkpoints: readonly string[];
  dependency_restoration: readonly string[];
  integrity_verification_steps: readonly string[];
  replay_validation_steps: readonly string[];
  escalation_preparation: readonly string[];
  operator_intervention_guidance: readonly string[];
  recovery_readiness_score: number;
  recovery_sequence: readonly string[];
  recovery_prerequisites: readonly string[];
  recovery_limitations: readonly string[];
  preparation_hash: string;
}>;

export type PreventativeRecommendation = Readonly<{
  recommendation_id: string;
  forecast_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  recommendation_type: PreventativeRecommendationType;
  priority: PreventativeRecommendationPriority;
  severity: RiskSeverityLevel;
  urgency: OperatorAdvisoryLevel;
  forecast_summary: string;
  recommended_action: string;
  expected_benefit: string;
  estimated_risk_reduction: number;
  mitigation_plan: MitigationPlan;
  contingency_options: readonly ContingencyOption[];
  governance_alternatives: readonly GovernanceAlternative[];
  recovery_preparation: RecoveryPreparationPlan;
  operator_required: boolean;
  approval_required: boolean;
  supporting_evidence: readonly string[];
  forecast_references: readonly string[];
  assumptions: readonly string[];
  constraints: readonly string[];
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  explanation: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  created_at: string;
  expires_at: string;
  advisory_only: true;
  recommendation_executed: boolean;
  mitigation_executed: boolean;
  recovery_initiated: boolean;
  governance_modified: boolean;
  constitutional_modified: boolean;
  authority_escalated: boolean;
  recommendation_hash: string;
}>;

export type PreventativeRecommendationRepository = Readonly<{
  repository_id: string;
  tenant_id: string;
  recommendation_ids: readonly string[];
  mitigation_plans: readonly string[];
  contingency_options: readonly string[];
  recovery_preparation_plans: readonly string[];
  governance_alternatives: readonly string[];
  operator_advisories: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_hashes: readonly string[];
  append_only: true;
  repository_hash: string;
}>;

export type PreventativeRecommendationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  pipeline_state: PreventativePipelineState;
  recommendations: readonly PreventativeRecommendation[];
  repository: PreventativeRecommendationRepository;
  source_forecast_report: RiskForecastingReport;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  report_hash: string;
}>;

export type PreventativeRecommendationInput = Readonly<{
  scenario?: PreventativeRecommendationScenario;
  forecast_report?: RiskForecastingReport;
  tenant_id?: string;
  mission_id?: string;
}>;

export type PreventativeRecommendationValidationResult = Readonly<{
  report_id: string | null;
  valid: boolean;
  recommendation_contract_valid: boolean;
  recommendation_schema_valid: boolean;
  preventative_recommendations_generated: boolean;
  mitigation_plans_reproducible: boolean;
  contingency_options_reproducible: boolean;
  operator_advisories_deterministic: boolean;
  governance_alternatives_reproducible: boolean;
  recovery_preparation_deterministic: boolean;
  priority_reproducible: boolean;
  evidence_complete: boolean;
  forecast_references_preserved: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  explanations_complete: boolean;
  replay_valid: boolean;
  lineage_preserved: boolean;
  integrity_valid: boolean;
  operator_approval_required: boolean;
  advisory_only: boolean;
  tenant_isolated: boolean;
  immutable_hash_valid: boolean;
  failures: readonly PreventativeRecommendationFailure[];
  validation_hash: string;
}>;

export type PreventativeRecommendationReplayResult = Readonly<{
  replay_reference: string;
  report_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type PreventativeRecommendationObservabilitySurface = Readonly<{
  report_id: string;
  recommendation_count: number;
  highest_priority: PreventativeRecommendationPriority;
  highest_urgency: OperatorAdvisoryLevel;
  tenant_id: string;
  advisory_only: true;
  report_hash: string;
}>;

export type PreventativeRecommendationEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "preventative-recommendation-engine/v8ALT.3.4";
    principles: readonly string[];
    recommendation_types: readonly PreventativeRecommendationType[];
    priority_levels: readonly PreventativeRecommendationPriority[];
    advisory_levels: readonly OperatorAdvisoryLevel[];
    pipeline_states: readonly PreventativePipelineState[];
    advisory_only: true;
  }>;
  report: PreventativeRecommendationReport;
  validation: PreventativeRecommendationValidationResult;
  replay: PreventativeRecommendationReplayResult;
  observability: PreventativeRecommendationObservabilitySurface;
}>;
