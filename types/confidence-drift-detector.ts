import type { ConfidenceCalibrationResult } from "@/types/confidence-calibration-engine";

export type ConfidenceDriftCategory = "NONE" | "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
export type ConfidenceDriftType =
  | "CONFIDENCE_ERROR"
  | "CALIBRATION"
  | "EVIDENCE_QUALITY"
  | "ENVIRONMENTAL"
  | "MISSION"
  | "TENANT"
  | "SEASONAL"
  | "DOMAIN";
export type ConfidenceDriftTrend = "STABLE" | "IMPROVING" | "DEGRADING" | "VOLATILE";
export type ConfidenceDriftValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type ConfidenceDriftFailure =
  | "HISTORICAL_BASELINE_MISSING"
  | "EVIDENCE_HISTORY_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "CONFIDENCE_MUTATION_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_ANALYSIS"
  | "AUTOMATIC_RECALIBRATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type ConfidenceDriftScenario =
  | "BASELINE"
  | "NONE"
  | "MINOR"
  | "MODERATE"
  | "SEVERE"
  | "CRITICAL"
  | "EVIDENCE_DETERIORATION"
  | "ENVIRONMENTAL_SHIFT"
  | "MISSION_SPECIFIC"
  | "TENANT_SPECIFIC"
  | "SEASONAL_VARIATION"
  | "DOMAIN_SPECIFIC"
  | "MISSING_BASELINE"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "CONFIDENCE_MUTATION"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC"
  | "AUTO_RECALIBRATION"
  | "FAIL_OPEN";

export type ConfidenceDriftRecord = Readonly<{
  confidence_drift_id: string;
  tenant_id: string;
  mission_scope: string;
  drift_type: ConfidenceDriftType;
  drift_category: ConfidenceDriftCategory;
  baseline_confidence: number;
  observed_confidence: number;
  drift_magnitude: number;
  drift_velocity: number;
  drift_duration_days: number;
  supporting_evidence_refs: readonly string[];
  outcome_refs: readonly string[];
  calibration_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  detection_timestamp: string;
  advisory_only: true;
  mutates_confidence: false;
  triggers_adaptation: false;
  integrity_hash: string;
}>;

export type ConfidenceTrendProfile = Readonly<{
  trend_profile_id: string;
  tenant_id: string;
  analysis_period: string;
  confidence_trend: ConfidenceDriftTrend;
  calibration_trend: ConfidenceDriftTrend;
  evidence_trend: ConfidenceDriftTrend;
  error_trend: ConfidenceDriftTrend;
  drift_summary: string;
  error_growth_rate: number;
  calibration_drift_rate: number;
  evidence_quality_delta: number;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceDriftTimeline = Readonly<{
  timeline_id: string;
  tenant_id: string;
  drift_event_refs: readonly string[];
  drift_start_timestamp: string;
  drift_duration_days: number;
  severity_history: readonly ConfidenceDriftCategory[];
  confidence_history: readonly number[];
  evidence_history: readonly number[];
  calibration_history: readonly number[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  append_only: true;
  immutable: true;
  integrity_hash: string;
}>;

export type DriftAnalysisReport = Readonly<{
  report_id: string;
  reporting_period: string;
  drift_summary: string;
  detected_patterns: readonly ConfidenceDriftType[];
  severity_distribution: Readonly<Record<ConfidenceDriftCategory, number>>;
  mission_drift: ConfidenceDriftCategory;
  tenant_drift: ConfidenceDriftCategory;
  seasonal_drift: ConfidenceDriftCategory;
  domain_drift: ConfidenceDriftCategory;
  governance_findings: readonly string[];
  recommended_actions: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceDriftRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  drift_record_refs: readonly string[];
  trend_profile_refs: readonly string[];
  timeline_refs: readonly string[];
  report_refs: readonly string[];
  severity_index: Readonly<Record<ConfidenceDriftCategory, readonly string[]>>;
  type_index: Readonly<Record<ConfidenceDriftType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type ConfidenceDriftValidation = Readonly<{
  validation_id: string;
  state: ConfidenceDriftValidationState;
  certified: boolean;
  failures: readonly ConfidenceDriftFailure[];
  baseline_complete: boolean;
  evidence_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  no_confidence_mutation: boolean;
  no_automatic_recalibration: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type ConfidenceDriftApiSurface = Readonly<{
  api_id: string;
  analyze_drift: "POST /confidence-drift-detector/analyze";
  retrieve_records: "POST /confidence-drift-detector/records";
  retrieve_timeline: "POST /confidence-drift-detector/timeline";
  retrieve_trends: "POST /confidence-drift-detector/trends";
  retrieve_report: "POST /confidence-drift-detector/report";
  retrieve_registry: "POST /confidence-drift-detector/registry";
  retrieve_evidence_drift: "POST /confidence-drift-detector/evidence";
  retrieve_environment_drift: "POST /confidence-drift-detector/environment";
  retrieve_mission_drift: "POST /confidence-drift-detector/mission";
  retrieve_tenant_drift: "POST /confidence-drift-detector/tenant";
  retrieve_seasonal_drift: "POST /confidence-drift-detector/seasonal";
  retrieve_domain_drift: "POST /confidence-drift-detector/domain";
  replay_analysis: "POST /confidence-drift-detector/replay";
  retrieve_contract: "GET /confidence-drift-detector/contract";
  update_supported: false;
  delete_supported: false;
  confidence_mutation_supported: false;
  recalibration_supported: false;
  adaptation_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceDriftInput = Readonly<{
  scenario?: ConfidenceDriftScenario;
  calibration_result?: ConfidenceCalibrationResult;
}>;

export type ConfidenceDriftResult = Readonly<{
  confidence_drift_detector_version: "confidence-drift-detector/v1";
  api_surface: ConfidenceDriftApiSurface;
  drift_records: readonly ConfidenceDriftRecord[];
  trend_profile: ConfidenceTrendProfile;
  timeline: ConfidenceDriftTimeline;
  report: DriftAnalysisReport;
  registry: ConfidenceDriftRegistry;
  validation: ConfidenceDriftValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_confidence: false;
  updates_model: false;
  triggers_adaptation: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceDriftFoundation = Readonly<{
  confidence_drift_detector_version: "confidence-drift-detector/v1";
  api_surface: ConfidenceDriftApiSurface;
  result: ConfidenceDriftResult;
}>;
