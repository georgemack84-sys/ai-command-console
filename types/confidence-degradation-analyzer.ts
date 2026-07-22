import type { EvidenceReliabilityResult } from "@/types/evidence-reliability-recalibrator";

export type ConfidenceDegradationLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ConfidenceDegradationType =
  | "CONFIDENCE_INFLATION"
  | "CONFIDENCE_COLLAPSE"
  | "CONFIDENCE_OSCILLATION"
  | "CONFIDENCE_INCONSISTENCY"
  | "AGING_MODEL"
  | "EVIDENCE_DECAY"
  | "REPEATED_PREDICTION_FAILURE"
  | "CONFIDENCE_SATURATION";
export type AgingModelCategory = "CURRENT" | "STABLE" | "AGING" | "DEGRADING" | "OBSOLETE";
export type PredictionFailureCategory = "ISOLATED" | "RECURRING" | "PERSISTENT" | "SYSTEMIC" | "CRITICAL";
export type ConfidenceQualityTrend = "HEALTHY" | "STABLE" | "DEGRADING" | "VOLATILE" | "RECOVERING";
export type ConfidenceDegradationValidationState = "ANALYZED" | "CERTIFIED" | "FAILED" | "PENDING_OUTCOME_VALIDATION";

export type ConfidenceDegradationFailure =
  | "CONFIDENCE_HISTORY_MISSING"
  | "OUTCOME_VALIDATION_MISSING"
  | "EVIDENCE_HISTORY_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "TENANT_ISOLATION_VIOLATED"
  | "INTEGRITY_HASH_MISMATCH"
  | "CONFIDENCE_MUTATION_DETECTED"
  | "CONFIDENCE_MODEL_UPDATE_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "AUTOMATIC_ADAPTATION_DETECTED"
  | "HISTORICAL_RECORD_MUTATION_DETECTED"
  | "REGISTRY_MUTATION_DETECTED"
  | "NONDETERMINISTIC_ANALYSIS"
  | "FAIL_OPEN_BEHAVIOR";

export type ConfidenceDegradationScenario =
  | "BASELINE"
  | "NONE"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL"
  | "INFLATION"
  | "COLLAPSE"
  | "OSCILLATION"
  | "INCONSISTENCY"
  | "AGING_MODEL"
  | "EVIDENCE_DECAY"
  | "REPEATED_FAILURE"
  | "SATURATION"
  | "MISSING_CONFIDENCE_HISTORY"
  | "MISSING_OUTCOME_VALIDATION"
  | "MISSING_EVIDENCE"
  | "MISSING_REPLAY"
  | "MISSING_GOVERNANCE"
  | "CROSS_TENANT"
  | "HASH_MISMATCH"
  | "CONFIDENCE_MUTATION"
  | "MODEL_UPDATE"
  | "GOVERNANCE_BYPASS"
  | "AUTO_ADAPTATION"
  | "HISTORICAL_RECORD_MUTATION"
  | "REGISTRY_MUTATION"
  | "NONDETERMINISTIC"
  | "FAIL_OPEN";

export type ConfidenceDegradationRecord = Readonly<{
  degradation_id: string;
  tenant_id: string;
  mission_scope: string;
  degradation_type: ConfidenceDegradationType;
  degradation_category: AgingModelCategory | PredictionFailureCategory | ConfidenceDegradationLevel;
  severity: ConfidenceDegradationLevel;
  detected_pattern: string;
  supporting_confidence_refs: readonly string[];
  supporting_outcome_refs: readonly string[];
  supporting_evidence_refs: readonly string[];
  confidence_accuracy_delta: number;
  degradation_duration_days: number;
  degradation_frequency: number;
  governance_impact: ConfidenceDegradationLevel;
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  advisory_only: true;
  mutates_confidence: false;
  updates_confidence_model: false;
  changes_governance_requirements: false;
  triggers_adaptation: false;
  mutates_historical_records: false;
  integrity_hash: string;
}>;

export type ConfidenceFailurePattern = Readonly<{
  pattern_id: string;
  tenant_id: string;
  failure_type: ConfidenceDegradationType;
  recurrence_frequency: number;
  affected_domains: readonly string[];
  root_cause_summary: string;
  evidence_refs: readonly string[];
  confidence_refs: readonly string[];
  recommended_investigation: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceTrendHistory = Readonly<{
  trend_history_id: string;
  tenant_id: string;
  reporting_period: string;
  confidence_quality_trend: ConfidenceQualityTrend;
  degradation_events: readonly string[];
  recovery_events: readonly string[];
  confidence_stability: number;
  trend_summary: string;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceDegradationReport = Readonly<{
  report_id: string;
  reporting_period: string;
  degradation_summary: string;
  detected_patterns: readonly ConfidenceDegradationType[];
  severity_distribution: Readonly<Record<ConfidenceDegradationLevel, number>>;
  confidence_trends: ConfidenceQualityTrend;
  evidence_findings: readonly string[];
  governance_findings: readonly string[];
  recommended_follow_up: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceDegradationRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  degradation_record_refs: readonly string[];
  failure_pattern_refs: readonly string[];
  trend_history_refs: readonly string[];
  report_refs: readonly string[];
  severity_index: Readonly<Record<ConfidenceDegradationLevel, readonly string[]>>;
  type_index: Readonly<Record<ConfidenceDegradationType, readonly string[]>>;
  append_only: true;
  immutable: true;
  deleted: boolean;
  integrity_hash: string;
}>;

export type ConfidenceDegradationValidation = Readonly<{
  validation_id: string;
  state: ConfidenceDegradationValidationState;
  certified: boolean;
  failures: readonly ConfidenceDegradationFailure[];
  confidence_history_complete: boolean;
  outcome_validation_complete: boolean;
  evidence_history_complete: boolean;
  replay_complete: boolean;
  governance_complete: boolean;
  tenant_isolated: boolean;
  deterministic: boolean;
  registry_immutable: boolean;
  advisory_only: boolean;
  no_confidence_mutation: boolean;
  no_model_update: boolean;
  no_governance_bypass: boolean;
  no_automatic_adaptation: boolean;
  no_historical_record_mutation: boolean;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type ConfidenceDegradationApiSurface = Readonly<{
  api_id: string;
  analyze_degradation: "POST /confidence-degradation-analyzer/analyze";
  retrieve_records: "POST /confidence-degradation-analyzer/records";
  retrieve_patterns: "POST /confidence-degradation-analyzer/patterns";
  retrieve_trends: "POST /confidence-degradation-analyzer/trends";
  retrieve_report: "POST /confidence-degradation-analyzer/report";
  retrieve_registry: "POST /confidence-degradation-analyzer/registry";
  retrieve_inflation: "POST /confidence-degradation-analyzer/inflation";
  retrieve_collapse: "POST /confidence-degradation-analyzer/collapse";
  retrieve_oscillation: "POST /confidence-degradation-analyzer/oscillation";
  retrieve_inconsistency: "POST /confidence-degradation-analyzer/inconsistency";
  retrieve_aging: "POST /confidence-degradation-analyzer/aging";
  retrieve_evidence_decay: "POST /confidence-degradation-analyzer/evidence-decay";
  retrieve_prediction_failures: "POST /confidence-degradation-analyzer/prediction-failures";
  retrieve_saturation: "POST /confidence-degradation-analyzer/saturation";
  replay_analysis: "POST /confidence-degradation-analyzer/replay";
  retrieve_contract: "GET /confidence-degradation-analyzer/contract";
  update_supported: false;
  delete_supported: false;
  confidence_mutation_supported: false;
  model_update_supported: false;
  governance_bypass_supported: false;
  automatic_adaptation_supported: false;
  historical_record_mutation_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceDegradationInput = Readonly<{
  scenario?: ConfidenceDegradationScenario;
  evidence_reliability_result?: EvidenceReliabilityResult;
}>;

export type ConfidenceDegradationResult = Readonly<{
  confidence_degradation_analyzer_version: "confidence-degradation-analyzer/v1";
  api_surface: ConfidenceDegradationApiSurface;
  degradation_records: readonly ConfidenceDegradationRecord[];
  failure_patterns: readonly ConfidenceFailurePattern[];
  trend_history: ConfidenceTrendHistory;
  report: ConfidenceDegradationReport;
  registry: ConfidenceDegradationRegistry;
  validation: ConfidenceDegradationValidation;
  deterministic: true;
  replayable: true;
  explainable: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_confidence: false;
  updates_confidence_model: false;
  changes_governance_requirements: false;
  triggers_adaptation: false;
  mutates_historical_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceDegradationFoundation = Readonly<{
  confidence_degradation_analyzer_version: "confidence-degradation-analyzer/v1";
  api_surface: ConfidenceDegradationApiSurface;
  result: ConfidenceDegradationResult;
}>;
