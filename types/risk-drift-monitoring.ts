import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type RiskDriftMonitoringStatus = "PASS" | "DRIFT_DETECTED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type RiskDriftMonitoringFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_BASELINE_CHANGE"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "RISK_INFLATION_DETECTED"
  | "RISK_SUPPRESSION_DETECTED"
  | "ESCALATION_THRESHOLD_DRIFT"
  | "HIDDEN_TOLERANCE_CHANGE"
  | "INCONSISTENT_SEVERITY_SCORING"
  | "UNSTABLE_PROBABILITY_ESTIMATION"
  | "INCONSISTENT_IMPACT_ESTIMATION"
  | "ADAPTATION_INDUCED_RISK_BIAS"
  | "HISTORICAL_RISK_DIVERGENCE"
  | "GOVERNANCE_SENSITIVITY_REDUCTION"
  | "UNAUTHORIZED_ESCALATION_EVOLUTION"
  | "PROBABILITY_CALIBRATION_DEGRADATION"
  | "NONDETERMINISTIC_ASSESSMENT"
  | "NONREPLAYABLE_RISK_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "PRODUCTION_RISK_MUTATION_ATTEMPT"
  | "UNKNOWN_RISK_BEHAVIOR";

export type RiskDriftMonitoringScenario =
  | "BASELINE"
  | "UNAUTHORIZED_BASELINE_CHANGE"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "RISK_INFLATION"
  | "RISK_SUPPRESSION"
  | "ESCALATION_THRESHOLD_DRIFT"
  | "HIDDEN_TOLERANCE_CHANGE"
  | "INCONSISTENT_SEVERITY"
  | "UNSTABLE_PROBABILITY"
  | "INCONSISTENT_IMPACT"
  | "ADAPTATION_RISK_BIAS"
  | "HISTORICAL_DIVERGENCE"
  | "GOVERNANCE_SENSITIVITY_REDUCTION"
  | "UNAUTHORIZED_ESCALATION_EVOLUTION"
  | "PROBABILITY_CALIBRATION_DEGRADATION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "PRODUCTION_MUTATION"
  | "UNKNOWN_BEHAVIOR";

export type RiskBaseline = Readonly<{
  baseline_id: string;
  risk_model_version: string;
  mission_scope: string;
  risk_categories: readonly string[];
  probability_model: readonly string[];
  impact_model: readonly string[];
  escalation_thresholds: readonly string[];
  approved_tolerance_levels: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type RiskConsistencyReport = Readonly<{
  report_id: string;
  probability_consistency: number;
  impact_consistency: number;
  severity_consistency: number;
  recommendation_consistency: number;
  escalation_consistency: number;
  evidence_weighting_consistency: number;
  historical_alignment: number;
  evaluation_variance_summary: string;
  decision_consistency_matrix: readonly string[];
  integrity_hash: string;
}>;

export type EscalationThresholdReport = Readonly<{
  report_id: string;
  escalation_threshold_report: string;
  escalation_drift_summary: string;
  threshold_stability_score: number;
  escalation_timing_score: number;
  escalation_frequency_score: number;
  approval_routing_score: number;
  detected_escalation_anomalies: readonly string[];
  integrity_hash: string;
}>;

export type RiskToleranceReport = Readonly<{
  report_id: string;
  accepted_risk_level_score: number;
  rejected_risk_level_score: number;
  residual_risk_acceptance_score: number;
  tolerance_drift_assessment: string;
  governance_impact_summary: string;
  operator_influence_report: string;
  detected_tolerance_anomalies: readonly string[];
  integrity_hash: string;
}>;

export type ProbabilityStabilityReport = Readonly<{
  report_id: string;
  probability_stability_report: string;
  probability_drift_analysis: string;
  estimation_consistency_score: number;
  probability_accuracy: number;
  probability_volatility: number;
  confidence_alignment: number;
  evidence_alignment: number;
  historical_calibration: number;
  prediction_stability: number;
  integrity_hash: string;
}>;

export type RiskStabilityReport = Readonly<{
  report_id: string;
  risk_stability_score: number;
  severity_variance_score: number;
  probability_variance_score: number;
  impact_variance_score: number;
  escalation_variance_score: number;
  tolerance_variance_score: number;
  governance_variance_score: number;
  historical_divergence_score: number;
  integrity_hash: string;
}>;

export type RiskDriftReport = Readonly<{
  report_id: string;
  detected_drift: readonly RiskDriftMonitoringFailure[];
  affected_risk_categories: readonly string[];
  probability_analysis: string;
  severity_analysis: string;
  escalation_analysis: string;
  tolerance_analysis: string;
  governance_impacts: readonly string[];
  constitutional_impacts: readonly string[];
  supporting_evidence: readonly string[];
  recommended_responses: readonly DriftResponse[];
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type EscalationDriftTimeline = Readonly<{
  timeline_id: string;
  risk_assessments: readonly string[];
  severity_changes: readonly string[];
  escalation_events: readonly string[];
  governance_reviews: readonly string[];
  simulation_outcomes: readonly string[];
  operator_decisions: readonly string[];
  adaptation_proposals: readonly string[];
  certification_events: readonly string[];
  detected_drift: readonly string[];
  containment_actions: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type RiskDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  baseline_ref: string;
  risk_model_version: string;
  drift_category: "RISK_DRIFT";
  risk_stability_score: number;
  probability_stability_score: number;
  severity_variance_score: number;
  escalation_variance_score: number;
  tolerance_variance_score: number;
  severity: DriftSeverity;
  affected_risk_assessments: readonly string[];
  affected_adaptations: readonly string[];
  affected_decisions: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  containment_required: boolean;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type RiskDriftMonitoringMetrics = Readonly<{
  risk_stability_score: number;
  probability_stability_score: number;
  severity_variance_score: number;
  escalation_variance_score: number;
  tolerance_variance_score: number;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  evidence_backed: boolean;
  governance_aligned: boolean;
  constitutional_aligned: boolean;
  tenant_isolated: boolean;
  failures: readonly RiskDriftMonitoringFailure[];
  integrity_hash: string;
}>;

export type RiskDriftMonitoringApiSurface = Readonly<{
  api_id: string;
  monitor_risk_drift: "POST /risk-drift-monitoring/monitor";
  retrieve_baseline: "POST /risk-drift-monitoring/baseline";
  retrieve_consistency_report: "POST /risk-drift-monitoring/consistency";
  retrieve_escalation_report: "POST /risk-drift-monitoring/escalation";
  retrieve_tolerance_report: "POST /risk-drift-monitoring/tolerance";
  retrieve_probability_report: "POST /risk-drift-monitoring/probability";
  retrieve_drift_report: "POST /risk-drift-monitoring/report";
  retrieve_timeline: "POST /risk-drift-monitoring/timeline";
  retrieve_ledger_record: "POST /risk-drift-monitoring/ledger";
  retrieve_metrics: "POST /risk-drift-monitoring/metrics";
  replay_monitoring: "POST /risk-drift-monitoring/replay";
  inspect_monitor: "POST /risk-drift-monitoring/inspect";
  retrieve_contract: "GET /risk-drift-monitoring/contract";
  production_risk_mutation_supported: false;
  automatic_escalation_policy_mutation_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type RiskDriftMonitoringInput = Readonly<{
  scenario?: RiskDriftMonitoringScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type RiskDriftMonitoringResult = Readonly<{
  risk_drift_monitoring_version: "risk-drift-monitoring/v1";
  monitor_identifier: "RiskDriftMonitoring";
  status: RiskDriftMonitoringStatus;
  api_surface: RiskDriftMonitoringApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: RiskBaseline;
  consistency_report: RiskConsistencyReport;
  escalation_report: EscalationThresholdReport;
  tolerance_report: RiskToleranceReport;
  probability_report: ProbabilityStabilityReport;
  stability_report: RiskStabilityReport;
  drift_report: RiskDriftReport;
  escalation_timeline: EscalationDriftTimeline;
  drift_record: RiskDriftRecord;
  metrics: RiskDriftMonitoringMetrics;
  failures: readonly RiskDriftMonitoringFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_risk: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskDriftMonitoringFoundation = Readonly<{
  risk_drift_monitoring_version: "risk-drift-monitoring/v1";
  api_surface: RiskDriftMonitoringApiSurface;
  result: RiskDriftMonitoringResult;
}>;
