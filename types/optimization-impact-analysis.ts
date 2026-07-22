import type { OptimizationDiscoveryCategory, OptimizationOpportunityRegistry } from "@/types/optimization-opportunity-discovery";

export type ImpactAnalysisState = "PENDING" | "BENEFIT_ANALYSIS" | "RESOURCE_ANALYSIS" | "RISK_ANALYSIS" | "CONSTRAINT_VALIDATION" | "COMPLETED";
export type ImpactDecisionOutcome = "ACCEPTABLE" | "REVIEW_REQUIRED" | "HIGH_RISK" | "REJECTED";
export type OptimizationImpactScenario = "BASELINE" | "MISSING_DISCOVERY_REGISTRY" | "OPPORTUNITY_NOT_READY" | "BENEFIT_ESTIMATE_MISMATCH" | "RESOURCE_REGRESSION" | "HIGH_DETERMINISTIC_RISK" | "REPLAY_RISK" | "GOVERNANCE_RISK" | "CONSTITUTIONAL_RISK" | "AUTHORITY_RISK" | "TENANT_ISOLATION_FAILURE" | "VISIBILITY_FAILURE" | "LINEAGE_MUTATION" | "AUTOMATIC_IMPLEMENTATION_ATTEMPT" | "RECOMMENDATION_AUTHORITY_ATTEMPT" | "INTEGRITY_FAILURE";
export type OptimizationImpactFailure = "DISCOVERY_REGISTRY_MISSING" | "OPPORTUNITY_NOT_READY_FOR_ANALYSIS" | "BENEFIT_ESTIMATE_MISMATCH_DETECTED" | "RESOURCE_REGRESSION_DETECTED" | "DETERMINISTIC_RISK_HIGH" | "REPLAY_RISK_HIGH" | "GOVERNANCE_RISK_HIGH" | "CONSTITUTIONAL_RISK_HIGH" | "AUTHORITY_RISK_HIGH" | "TENANT_ISOLATION_FAILED" | "OPERATOR_VISIBILITY_FAILED" | "LINEAGE_MUTATION_DETECTED" | "AUTOMATIC_IMPLEMENTATION_ATTEMPTED" | "RECOMMENDATION_AUTHORITY_ATTEMPTED" | "INTEGRITY_VERIFICATION_FAILED";

export type ImpactAnalysisRecord = Readonly<{
  impact_analysis_id: string;
  opportunity_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  subsystem: string;
  optimization_category: OptimizationDiscoveryCategory;
  current_performance: number;
  projected_performance: number;
  projected_improvement: number;
  efficiency_score: number;
  confidence_score: number;
  resource_impact_score: number;
  implementation_complexity: number;
  overall_risk_score: number;
  analysis_status: ImpactAnalysisState;
  decision_outcome: ImpactDecisionOutcome;
  advisory_only: true;
  execution_authority: false;
  automatic_implementation: boolean;
  recommendation_authority: boolean;
  timestamp: string;
  integrity_hash: string;
}>;

export type BenefitEstimationRecord = Readonly<{
  estimation_id: string;
  opportunity_id: string;
  performance_metric: string;
  baseline_value: number;
  projected_value: number;
  improvement_percentage: number;
  confidence_score: number;
  historical_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type ResourceImpactReport = Readonly<{
  report_id: string;
  opportunity_id: string;
  CPU_delta: number;
  memory_delta: number;
  storage_delta: number;
  network_delta: number;
  scheduling_delta: number;
  replay_delta: number;
  utilization_score: number;
  sustainability_score: number;
  integrity_hash: string;
  timestamp: string;
}>;

export type RiskAssessmentReport = Readonly<{
  risk_report_id: string;
  opportunity_id: string;
  deterministic_risk: number;
  replay_risk: number;
  governance_risk: number;
  constitutional_risk: number;
  authority_risk: number;
  operational_risk: number;
  implementation_risk: number;
  mitigation_plan: readonly string[];
  confidence_score: number;
  integrity_hash: string;
  timestamp: string;
}>;

export type ConstraintPreservationRecord = Readonly<{
  constraint_record_id: string;
  opportunity_id: string;
  deterministic_validation: "PASS" | "FAIL";
  replay_validation: "PASS" | "FAIL";
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  tenant_validation: "PASS" | "FAIL";
  visibility_validation: "PASS" | "FAIL";
  explainability_validation: "PASS" | "FAIL";
  lineage_validation: "PASS" | "FAIL";
  integrity_hash: string;
  timestamp: string;
}>;

export type OptimizationImpactAnalysisLedger = Readonly<{
  ledger_id: string;
  final_state: "OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE" | "OPTIMIZATION_IMPACT_ANALYSIS_BLOCKED";
  source_registry_id: string | null;
  analyses: readonly ImpactAnalysisRecord[];
  benefits: readonly BenefitEstimationRecord[];
  resources: readonly ResourceImpactReport[];
  risks: readonly RiskAssessmentReport[];
  constraints: readonly ConstraintPreservationRecord[];
  failures: readonly OptimizationImpactFailure[];
  advisory_only: true;
  execution_authority: false;
  automatic_implementation: false;
  recommendation_authority: false;
  integrity_hash: string;
}>;

export type OptimizationImpactValidationResult = Readonly<{
  ledger_id: string;
  valid: boolean;
  every_opportunity_analyzed: boolean;
  benefits_reproducible: boolean;
  resources_assessed: boolean;
  risks_assessed: boolean;
  constraints_preserved: boolean;
  deterministic_preserved: boolean;
  replay_preserved: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  operator_visibility_preserved: boolean;
  lineage_immutable: boolean;
  advisory_only: true;
  execution_authority_absent: boolean;
  automatic_implementation_absent: boolean;
  recommendation_authority_absent: boolean;
  ready_for_deterministic_validation: boolean;
  fail_closed: boolean;
  failures: readonly OptimizationImpactFailure[];
  validation_hash: string;
}>;

export type OptimizationImpactObservabilitySurface = Readonly<{
  ledger_id: string;
  final_state: string;
  analysis_count: number;
  acceptable_count: number;
  review_count: number;
  high_risk_count: number;
  rejected_count: number;
  failure_count: number;
  advisory_only: true;
  execution_authority: false;
  integrity_hash: string;
}>;

export type OptimizationImpactInput = Readonly<{ scenario?: OptimizationImpactScenario; registry?: OptimizationOpportunityRegistry | null; ledger?: OptimizationImpactAnalysisLedger }>;

export type OptimizationImpactAnalysisBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "optimization-impact-analysis/v8ALT.8.2";
    final_state: "OPTIMIZATION_IMPACT_ANALYSIS_COMPLETE";
    workflow: readonly ImpactAnalysisState[];
    decision_outcomes: readonly ImpactDecisionOutcome[];
    principles: readonly string[];
  }>;
  ledger: OptimizationImpactAnalysisLedger;
  validation: OptimizationImpactValidationResult;
  observability: OptimizationImpactObservabilitySurface;
}>;
