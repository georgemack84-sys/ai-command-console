export type TrustDriftOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type DriftCategory = "TRUST_DRIFT" | "ALIGNMENT_DRIFT" | "CONFIDENCE_DRIFT" | "GOVERNANCE_DRIFT" | "SAFETY_DRIFT" | "OPERATIONAL_DRIFT" | "EVIDENCE_DRIFT";
export type DriftSeverity = "NONE" | "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL";
export type DriftState = "NO_DRIFT" | "DRIFT_DETECTED" | "UNDER_ANALYSIS" | "ESCALATED" | "MITIGATED" | "RESOLVED";
export type DriftAlertPriority = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TrustDriftFailure =
  | "P5_13_MONITORING_INVALID"
  | "TRUST_DRIFT_ENGINE_MISSING"
  | "ALIGNMENT_DRIFT_ANALYZER_MISSING"
  | "CONFIDENCE_DEGRADATION_ANALYZER_MISSING"
  | "TRUST_DEGRADATION_ANALYZER_MISSING"
  | "DRIFT_CLASSIFICATION_MISSING"
  | "DRIFT_SEVERITY_ENGINE_MISSING"
  | "HISTORICAL_TREND_ANALYZER_MISSING"
  | "ROOT_CAUSE_ANALYSIS_MISSING"
  | "DRIFT_ALERT_ENGINE_MISSING"
  | "DRIFT_EVIDENCE_REGISTRY_MISSING"
  | "GOVERNANCE_INTEGRATION_MISSING"
  | "HISTORICAL_BASELINE_MISSING"
  | "CURRENT_STATE_MISSING"
  | "DRIFT_INDICATORS_MISSING"
  | "DRIFT_SEVERITY_NONDETERMINISTIC"
  | "DRIFT_DETECTION_NONDETERMINISTIC"
  | "DRIFT_REPLAY_FAILED"
  | "DRIFT_EVIDENCE_MISSING"
  | "DRIFT_EVIDENCE_UNVERIFIABLE"
  | "DRIFT_REPORT_MISSING"
  | "DRIFT_ALERTS_MISSING"
  | "DRIFT_EXPLANATION_INCOMPLETE"
  | "GOVERNANCE_ESCALATION_RULES_MISSING"
  | "TRACEABILITY_INCOMPLETE"
  | "TRUST_STANDING_RECALCULATED"
  | "TRUST_STANDING_MODIFIED"
  | "TRUST_DECISION_ISSUED"
  | "TRUST_MONITORING_DASHBOARD_EXECUTED"
  | "GOVERNANCE_REVIEW_EXECUTED"
  | "SAFETY_QUALIFICATION_EXECUTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustDriftScenario = "BASELINE" | TrustDriftFailure;
export type TrustDriftInput = Readonly<{ scenario?: TrustDriftScenario; trust_identity?: string; tenant_id?: string }>;

export type TrustDriftRecord = Readonly<{ drift_id: string; trust_identity: string; tenant_id: string; evaluation_time: string; historical_baseline: string; current_state: string; drift_category: DriftCategory; drift_severity: DriftSeverity; confidence_delta: number; alignment_delta: number; risk_delta: number; governance_delta: number; safety_delta: number; supporting_evidence: readonly string[]; historical_trend: readonly string[]; root_cause_analysis: readonly string[]; recommended_escalation: string; drift_state: DriftState; integrity_hash: string }>;
export type DriftClassification = Readonly<{ classification_id: string; categories: readonly DriftCategory[]; indicators: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type DriftSeverityAssessment = Readonly<{ severity_id: string; severity: DriftSeverity; threshold_model: string; deterministic_thresholds: boolean; confidence_delta: number; risk_delta: number; integrity_hash: string }>;
export type DriftTrendAnalysis = Readonly<{ trend_id: string; methods: readonly string[]; historical_comparison: boolean; replay_comparison: boolean; trend_direction: "IMPROVING" | "STABLE" | "DETERIORATING" | "VOLATILE" | "UNKNOWN"; integrity_hash: string }>;
export type DriftEvidenceRegistry = Readonly<{ registry_id: string; evidence_refs: readonly string[]; verifiable: boolean; lineage_refs: readonly string[]; replay_refs: readonly string[]; integrity_hash: string }>;
export type DriftReport = Readonly<{ report_id: string; trust_identity: string; summary: string; drift_records: readonly string[]; degradation_findings: readonly string[]; explanation: string; evidence_refs: readonly string[]; governance_recommendations: readonly string[]; integrity_hash: string }>;
export type DriftAlert = Readonly<{ alert_id: string; drift_type: DriftCategory; affected_trust_identity: string; severity: DriftSeverity; priority: DriftAlertPriority; evidence_summary: string; trend_history: readonly string[]; recommended_response: string; integrity_hash: string }>;
export type DriftEngineState = Readonly<{ engine_id: string; trust_drift_engine: boolean; alignment_drift_analyzer: boolean; confidence_degradation_analyzer: boolean; trust_degradation_analyzer: boolean; drift_classification_framework: boolean; drift_severity_engine: boolean; historical_trend_analyzer: boolean; root_cause_analysis_engine: boolean; drift_alert_engine: boolean; drift_evidence_registry: boolean; governance_integration_contracts: boolean; integrity_hash: string }>;
export type DriftBoundary = Readonly<{ boundary_id: string; trust_standing_recalculated: boolean; trust_standing_modified: boolean; trust_decision_issued: boolean; trust_monitoring_dashboard_executed: boolean; governance_review_executed: boolean; safety_qualification_executed: boolean; tenant_isolation_preserved: boolean; integrity_hash: string }>;
export type TrustDriftCertification = Readonly<{ certification_id: string; outcome: TrustDriftOutcome; phase_ready: boolean; trust_drift_detection_operational: boolean; alignment_drift_detection_operational: boolean; confidence_degradation_operational: boolean; trust_degradation_operational: boolean; classification_complete: boolean; severity_deterministic: boolean; trend_analysis_operational: boolean; replay_validation_succeeds: boolean; explainability_complete: boolean; governance_escalation_rules_implemented: boolean; alerts_generated_deterministically: boolean; outputs_traceable: boolean; boundary_respected: boolean; failures: readonly TrustDriftFailure[]; integrity_hash: string }>;
export type TrustDriftResult = Readonly<{ phase_version: "trust-drift-detection/v5.14"; phase_identifier: "TrustDriftDetection"; monitoring_ref: "trust-continuous-monitoring/v5.13"; engine: DriftEngineState; classification: DriftClassification; severity: DriftSeverityAssessment; trends: DriftTrendAnalysis; evidence: DriftEvidenceRegistry; record: TrustDriftRecord; report: DriftReport; alerts: readonly DriftAlert[]; boundary: DriftBoundary; certification: TrustDriftCertification; replay_hash: string; integrity_hash: string }>;
export type TrustDriftValidation = Readonly<{ valid: boolean; outcome: TrustDriftOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; engine_valid: boolean; classification_valid: boolean; severity_valid: boolean; trends_valid: boolean; evidence_valid: boolean; record_valid: boolean; report_valid: boolean; alerts_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustDriftFailure[]; integrity_hash: string }>;
export type TrustDriftBundle = Readonly<{ doctrine: Readonly<{ version: "trust-drift-detection/v5.14"; owns_trust_drift: true; owns_alignment_drift: true; owns_confidence_degradation: true; owns_trust_degradation: true; recalculates_trust_standing: false; performs_monitoring_dashboards: false; executes_governance_reviews: false; qualifies_safety: false; issues_trust_decisions: false }>; result: TrustDriftResult; validation: TrustDriftValidation }>;
