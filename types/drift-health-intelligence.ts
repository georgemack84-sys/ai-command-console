import type { RuntimeObservationPackage } from "@/types/runtime-observation-engine";

export type DriftHealthState = "INITIALIZING" | "BASELINE_ESTABLISHED" | "MONITORING" | "ANALYZING" | "DRIFT_DETECTED" | "HEALTH_DEGRADED" | "CORRELATING" | "ASSESSING" | "ALERTING" | "STABLE" | "FAILED";

export type DriftCategory = "EXECUTION" | "GOVERNANCE" | "CONFIDENCE" | "HEALTH";

export type DriftSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type GovernanceDriftState = "COMPLIANT" | "MINOR_DRIFT" | "MODERATE_DRIFT" | "MAJOR_DRIFT" | "CRITICAL_DRIFT";

export type ConfidenceTrendState = "IMPROVING" | "STABLE" | "DECLINING" | "UNSTABLE" | "COLLAPSED";

export type DriftRuntimeHealthLevel = "OPTIMAL" | "HEALTHY" | "STABLE" | "DEGRADED" | "HIGH_RISK" | "CRITICAL";

export type DriftHealthScenario =
  | "BASELINE"
  | "WORKFLOW_DEVIATION"
  | "CHECKPOINT_VIOLATION"
  | "ORDERING_VIOLATION"
  | "UNAUTHORIZED_STATE_TRANSITION"
  | "POLICY_DRIFT"
  | "AUTHORITY_DRIFT"
  | "CONSTITUTIONAL_DRIFT"
  | "CONFIDENCE_DEGRADATION"
  | "EVIDENCE_DETERIORATION"
  | "HEALTH_DEGRADATION"
  | "RETRY_STORM"
  | "DEPENDENCY_FAILURE"
  | "SEVERITY_NONDETERMINISTIC"
  | "TREND_REPLAY_FAILED"
  | "ALERT_INCOMPLETE"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_MISMATCH"
  | "TENANT_VIOLATION"
  | "HIDDEN_ANALYSIS"
  | "HASH_MISMATCH";

export type DriftHealthFailureReason =
  | "EXECUTION_DRIFT_NOT_DETECTED"
  | "WORKFLOW_DEVIATION_MISSED"
  | "CHECKPOINT_VIOLATION_MISSED"
  | "ORDERING_DRIFT_MISSED"
  | "GOVERNANCE_DRIFT_NOT_IDENTIFIED"
  | "AUTHORITY_DRIFT_NOT_RECOGNIZED"
  | "CONSTITUTIONAL_DRIFT_NOT_DETECTED"
  | "CONFIDENCE_DEGRADATION_NOT_MEASURED"
  | "EVIDENCE_DETERIORATION_NOT_IDENTIFIED"
  | "HEALTH_DEGRADATION_NOT_ASSESSED"
  | "RETRY_STORM_MISSED"
  | "DEPENDENCY_FAILURE_MISSED"
  | "SEVERITY_SCORING_NONDETERMINISTIC"
  | "TREND_ANALYSIS_NOT_REPRODUCIBLE"
  | "SUPERVISION_ALERT_INCOMPLETE"
  | "DRIFT_EVIDENCE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "HIDDEN_ANALYTICAL_STATE_DETECTED";

export type DriftIntelligence = Readonly<{
  drift_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  drift_category: DriftCategory;
  drift_type: string;
  expected_behavior: string;
  observed_behavior: string;
  severity: DriftSeverity;
  confidence: number;
  impact_score: number;
  affected_components: readonly string[];
  supporting_observations: readonly string[];
  timestamp: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type HealthAssessment = Readonly<{
  assessment_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  runtime_health: DriftRuntimeHealthLevel;
  execution_health: DriftRuntimeHealthLevel;
  governance_health: DriftRuntimeHealthLevel;
  confidence_health: DriftRuntimeHealthLevel;
  dependency_health: DriftRuntimeHealthLevel;
  resource_health: DriftRuntimeHealthLevel;
  overall_health_score: number;
  degradation_trend: ConfidenceTrendState;
  timestamp: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type SupervisionAlert = Readonly<{
  alert_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  alert_type: string;
  severity: DriftSeverity;
  detected_drift: readonly string[];
  health_state: DriftRuntimeHealthLevel;
  confidence_state: ConfidenceTrendState;
  governance_state: GovernanceDriftState;
  recommended_action: string;
  evidence_reference: string;
  replay_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DriftHealthEvidence = Readonly<{
  evidence_id: string;
  drift_id: string;
  assessment_id: string;
  alert_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  supporting_observations: readonly string[];
  severity_score: number;
  trend_state: ConfidenceTrendState;
  correlation_factors: readonly string[];
  truth_ledger_reference: string;
  replay_reference: string;
  lineage_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DriftHealthValidationResult = Readonly<{
  validation_id: string;
  package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly DriftHealthFailureReason[];
  baseline_established: boolean;
  drift_reproducible: boolean;
  health_deterministic: boolean;
  severity_reproducible: boolean;
  governance_correlation_valid: boolean;
  confidence_trend_deterministic: boolean;
  evidence_complete: boolean;
  replay_ready: boolean;
  lineage_preserved: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  hidden_analysis_prohibited: boolean;
  ready_for_supervision_alerting: boolean;
  validation_hash: string;
}>;

export type DriftHealthReplayResult = Readonly<{
  replay_id: string;
  package_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_drift_hash: string;
  reconstructed_health_hash: string;
  reconstructed_alert_hash: string;
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: DriftHealthFailureReason | null;
  replay_hash: string;
}>;

export type DriftHealthPackage = Readonly<{
  package_id: string;
  engine_version: "drift-health-intelligence/v8E.C";
  source_observation_package: RuntimeObservationPackage;
  analysis_state: DriftHealthState;
  drift_intelligence: DriftIntelligence;
  health_assessment: HealthAssessment;
  supervision_alert: SupervisionAlert;
  drift_evidence: DriftHealthEvidence;
  validation: DriftHealthValidationResult;
  replay: DriftHealthReplayResult;
  advisory_only: true;
  execution_modified: false;
  governance_modified: false;
  adaptive_behavior_triggered: false;
  hidden_analysis_used: false;
  package_hash: string;
}>;

export type DriftHealthDashboardSurface = Readonly<{
  package_id: string;
  execution_id: string;
  analysis_state: DriftHealthState;
  severity: DriftSeverity;
  runtime_health: DriftRuntimeHealthLevel;
  degradation_trend: ConfidenceTrendState;
  recommended_action: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly DriftHealthFailureReason[];
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type DriftHealthFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "drift-health-intelligence/v8E.C";
    states: readonly DriftHealthState[];
    severity_levels: readonly DriftSeverity[];
    runtime_health_levels: readonly DriftRuntimeHealthLevel[];
  }>;
  package: DriftHealthPackage;
  dashboard: DriftHealthDashboardSurface;
}>;
