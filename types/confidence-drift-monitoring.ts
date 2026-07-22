import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type ConfidenceDriftMonitoringStatus = "PASS" | "DRIFT_DETECTED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type ConfidenceDriftMonitoringFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_BASELINE_CHANGE"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "CONFIDENCE_INFLATION_DETECTED"
  | "CONFIDENCE_COLLAPSE_DETECTED"
  | "UNEXPLAINED_CONFIDENCE_SHIFT"
  | "CONFIDENCE_INSTABILITY_DETECTED"
  | "EVIDENCE_CONFIDENCE_MISMATCH"
  | "HISTORICAL_CONFIDENCE_DIVERGENCE"
  | "UNSUPPORTED_CERTAINTY_DETECTED"
  | "EXCESSIVE_UNCERTAINTY_DETECTED"
  | "CONFIDENCE_OSCILLATION_DETECTED"
  | "ADAPTATION_INDUCED_CALIBRATION_DEGRADATION"
  | "NONDETERMINISTIC_ASSESSMENT"
  | "NONREPLAYABLE_CONFIDENCE_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "PRODUCTION_CONFIDENCE_MUTATION_ATTEMPT"
  | "UNKNOWN_CONFIDENCE_BEHAVIOR";

export type ConfidenceDriftMonitoringScenario =
  | "BASELINE"
  | "UNAUTHORIZED_BASELINE_CHANGE"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "CONFIDENCE_INFLATION"
  | "CONFIDENCE_COLLAPSE"
  | "UNEXPLAINED_SHIFT"
  | "CONFIDENCE_INSTABILITY"
  | "EVIDENCE_MISMATCH"
  | "HISTORICAL_DIVERGENCE"
  | "UNSUPPORTED_CERTAINTY"
  | "EXCESSIVE_UNCERTAINTY"
  | "CONFIDENCE_OSCILLATION"
  | "ADAPTATION_DEGRADATION"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "PRODUCTION_MUTATION"
  | "UNKNOWN_BEHAVIOR";

export type ConfidenceBaseline = Readonly<{
  baseline_id: string;
  confidence_model_version: string;
  mission_scope: string;
  calibration_profile: readonly string[];
  confidence_thresholds: readonly string[];
  evidence_weighting_rules: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type ConfidenceCalibrationReport = Readonly<{
  report_id: string;
  calibration_score: number;
  calibration_curve: readonly number[];
  confidence_accuracy_report: string;
  confidence_reliability_summary: string;
  prediction_accuracy: number;
  uncertainty_representation_score: number;
  detected_anomalies: readonly string[];
  governance_impacts: readonly string[];
  recommended_actions: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceStabilityAnalysis = Readonly<{
  analysis_id: string;
  stability_score: number;
  confidence_consistency: number;
  calibration_persistence: number;
  confidence_volatility: number;
  prediction_stability: number;
  adaptation_stability: number;
  trend_persistence: number;
  confidence_recovery: number;
  confidence_stability_report: string;
  drift_trend_analysis: string;
  integrity_hash: string;
}>;

export type EvidenceConfidenceValidation = Readonly<{
  validation_id: string;
  evidence_sufficiency: number;
  evidence_freshness: number;
  evidence_quality: number;
  evidence_diversity: number;
  evidence_consistency: number;
  evidence_completeness: number;
  evidence_lineage: readonly string[];
  evidence_alignment_report: string;
  evidence_confidence_ratio: number;
  validation_summary: string;
  detected_mismatches: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalConfidenceAnalysis = Readonly<{
  analysis_id: string;
  historical_drift_analysis: string;
  confidence_evolution_report: string;
  trend_consistency_report: string;
  historical_calibration_score: number;
  historical_prediction_accuracy: number;
  confidence_trends: readonly string[];
  adaptation_history: readonly string[];
  mission_consistency_score: number;
  operator_influence_report: string;
  integrity_hash: string;
}>;

export type ConfidenceDriftIndexReport = Readonly<{
  index_id: string;
  confidence_drift_index: number;
  calibration_deviation: number;
  confidence_variance: number;
  historical_divergence: number;
  evidence_mismatch: number;
  confidence_volatility: number;
  prediction_inconsistency: number;
  confidence_trend_deviation: number;
  integrity_hash: string;
}>;

export type ConfidenceDriftTimeline = Readonly<{
  timeline_id: string;
  confidence_changes: readonly string[];
  calibration_updates: readonly string[];
  drift_events: readonly string[];
  evidence_changes: readonly string[];
  adaptation_proposals: readonly string[];
  governance_reviews: readonly string[];
  simulation_results: readonly string[];
  operator_decisions: readonly string[];
  certification_events: readonly string[];
  replay_refs: readonly string[];
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type ConfidenceDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  baseline_ref: string;
  confidence_model_version: string;
  drift_category: "CONFIDENCE_DRIFT";
  confidence_drift_index: number;
  calibration_score: number;
  stability_score: number;
  severity: DriftSeverity;
  evidence_alignment_score: number;
  affected_adaptations: readonly string[];
  affected_decisions: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  containment_required: boolean;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type ConfidenceDriftMonitoringMetrics = Readonly<{
  confidence_drift_index: number;
  calibration_score: number;
  stability_score: number;
  evidence_alignment_score: number;
  historical_consistency_score: number;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_aligned: boolean;
  constitutional_aligned: boolean;
  tenant_isolated: boolean;
  failures: readonly ConfidenceDriftMonitoringFailure[];
  integrity_hash: string;
}>;

export type ConfidenceDriftMonitoringApiSurface = Readonly<{
  api_id: string;
  monitor_confidence_drift: "POST /confidence-drift-monitoring/monitor";
  retrieve_baseline: "POST /confidence-drift-monitoring/baseline";
  retrieve_calibration_report: "POST /confidence-drift-monitoring/calibration";
  retrieve_evidence_validation: "POST /confidence-drift-monitoring/evidence";
  retrieve_timeline: "POST /confidence-drift-monitoring/timeline";
  retrieve_ledger_record: "POST /confidence-drift-monitoring/ledger";
  retrieve_metrics: "POST /confidence-drift-monitoring/metrics";
  replay_monitoring: "POST /confidence-drift-monitoring/replay";
  inspect_monitor: "POST /confidence-drift-monitoring/inspect";
  retrieve_contract: "GET /confidence-drift-monitoring/contract";
  production_confidence_mutation_supported: false;
  automatic_recalibration_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceDriftMonitoringInput = Readonly<{
  scenario?: ConfidenceDriftMonitoringScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type ConfidenceDriftMonitoringResult = Readonly<{
  confidence_drift_monitoring_version: "confidence-drift-monitoring/v1";
  monitor_identifier: "ConfidenceDriftMonitoring";
  status: ConfidenceDriftMonitoringStatus;
  api_surface: ConfidenceDriftMonitoringApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: ConfidenceBaseline;
  calibration_report: ConfidenceCalibrationReport;
  stability_analysis: ConfidenceStabilityAnalysis;
  evidence_validation: EvidenceConfidenceValidation;
  historical_analysis: HistoricalConfidenceAnalysis;
  drift_index_report: ConfidenceDriftIndexReport;
  drift_timeline: ConfidenceDriftTimeline;
  drift_record: ConfidenceDriftRecord;
  metrics: ConfidenceDriftMonitoringMetrics;
  failures: readonly ConfidenceDriftMonitoringFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_confidence: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceDriftMonitoringFoundation = Readonly<{
  confidence_drift_monitoring_version: "confidence-drift-monitoring/v1";
  api_surface: ConfidenceDriftMonitoringApiSurface;
  result: ConfidenceDriftMonitoringResult;
}>;
