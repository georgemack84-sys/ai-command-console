import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type ReplayDriftStatus = "PASS" | "DRIFT_DETECTED" | "CONTAINED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type ReplayDriftFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_REPLAY_CHANGE"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "BEHAVIORAL_INCONSISTENCY_DETECTED"
  | "REPLAY_INSTABILITY_DETECTED"
  | "DETERMINISTIC_FAILURE_DETECTED"
  | "RECONSTRUCTION_MISMATCH_DETECTED"
  | "ADAPTATION_INDUCED_REPLAY_CHANGE"
  | "INCONSISTENT_REPLAY_OUTPUTS"
  | "REPLAY_SEQUENCING_DRIFT"
  | "REPLAY_DEPENDENCY_DRIFT"
  | "REPLAY_STATE_CORRUPTION"
  | "RECOMMENDATION_VARIANCE"
  | "GOVERNANCE_VARIANCE"
  | "DECISION_PATH_DEVIATION"
  | "EXECUTION_INCONSISTENCY"
  | "MISSING_REPLAY_EVENTS"
  | "INCOMPLETE_REPLAY_LINEAGE"
  | "RECONSTRUCTION_CORRUPTION"
  | "TIMELINE_INCONSISTENCY"
  | "NONDETERMINISTIC_EXECUTION"
  | "INCONSISTENT_STATE_TRANSITIONS"
  | "DEPENDENCY_INDUCED_DRIFT"
  | "REPLAY_ARTIFACT_INCONSISTENCY"
  | "ADAPTIVE_REPLAY_DEGRADATION"
  | "NONREPLAYABLE_DRIFT_ASSESSMENT"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_REPLAY_BEHAVIOR";

export type ReplayDriftScenario =
  | "BASELINE"
  | "UNAUTHORIZED_REPLAY_CHANGE"
  | "REPLAY_DIVERGENCE"
  | "BEHAVIORAL_INCONSISTENCY"
  | "REPLAY_INSTABILITY"
  | "DETERMINISTIC_FAILURE"
  | "RECONSTRUCTION_MISMATCH"
  | "ADAPTATION_INDUCED_CHANGE"
  | "INCONSISTENT_OUTPUTS"
  | "SEQUENCING_DRIFT"
  | "DEPENDENCY_DRIFT"
  | "STATE_CORRUPTION"
  | "RECOMMENDATION_VARIANCE"
  | "GOVERNANCE_VARIANCE"
  | "DECISION_PATH_DEVIATION"
  | "EXECUTION_INCONSISTENCY"
  | "MISSING_EVENTS"
  | "INCOMPLETE_LINEAGE"
  | "RECONSTRUCTION_CORRUPTION"
  | "TIMELINE_INCONSISTENCY"
  | "NONDETERMINISTIC_EXECUTION"
  | "INCONSISTENT_STATE_TRANSITIONS"
  | "DEPENDENCY_INDUCED_DRIFT"
  | "ARTIFACT_INCONSISTENCY"
  | "ADAPTIVE_REPLAY_DEGRADATION"
  | "NONREPLAYABLE_ASSESSMENT"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type ReplayBaseline = Readonly<{
  baseline_id: string;
  replay_version: string;
  deterministic_rules: readonly string[];
  reconstruction_requirements: readonly string[];
  validation_policies: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  certification_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type ReplayConsistencyReport = Readonly<{
  report_id: string;
  output_consistency_score: number;
  decision_path_consistency_score: number;
  recommendation_ordering_score: number;
  governance_evaluation_score: number;
  evidence_lineage_score: number;
  artifact_consistency_score: number;
  replay_difference_summary: string;
  behavioral_comparison_matrix: readonly string[];
  detected_differences: readonly ReplayDriftFailure[];
  integrity_hash: string;
}>;

export type BehavioralConsistencyReport = Readonly<{
  report_id: string;
  decision_consistency_score: number;
  recommendation_consistency_score: number;
  evidence_processing_score: number;
  governance_behavior_score: number;
  operator_visibility_score: number;
  audit_generation_score: number;
  certification_behavior_score: number;
  decision_variance_analysis: string;
  detected_variances: readonly ReplayDriftFailure[];
  integrity_hash: string;
}>;

export type ReplayReconstructionReport = Readonly<{
  report_id: string;
  event_reconstruction_score: number;
  decision_reconstruction_score: number;
  recommendation_reconstruction_score: number;
  evidence_reconstruction_score: number;
  governance_reconstruction_score: number;
  simulation_reconstruction_score: number;
  audit_reconstruction_score: number;
  ledger_reconstruction_score: number;
  reconstruction_integrity_summary: string;
  reconstruction_failures: readonly ReplayDriftFailure[];
  integrity_hash: string;
}>;

export type DeterminismVerificationReport = Readonly<{
  report_id: string;
  deterministic_execution_score: number;
  identical_output_score: number;
  state_consistency_score: number;
  reproducibility_score: number;
  ordering_consistency_score: number;
  dependency_consistency_score: number;
  execution_integrity_score: number;
  execution_stability_analysis: string;
  deterministic_failures: readonly ReplayDriftFailure[];
  integrity_hash: string;
}>;

export type ReplayStabilityReport = Readonly<{
  score_id: string;
  replay_consistency_score: number;
  determinism_score: number;
  reconstruction_score: number;
  behavioral_consistency_score: number;
  dependency_stability_score: number;
  replay_integrity_score: number;
  replay_drift_score: number;
  integrity_hash: string;
}>;

export type ReplayIntegrityAssessment = Readonly<{
  assessment_id: string;
  drift_detected: boolean;
  detected_behaviors: readonly ReplayDriftFailure[];
  affected_replay_refs: readonly string[];
  replay_consistency: string;
  replay_divergence: string;
  behavioral_analysis: string;
  reconstruction_analysis: string;
  deterministic_verification: string;
  governance_impacts: readonly string[];
  certification_impacts: readonly string[];
  supporting_evidence: readonly string[];
  recommended_response: DriftResponse;
  containment_actions: readonly string[];
  severity: DriftSeverity;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type ReplayDriftTimeline = Readonly<{
  timeline_id: string;
  replay_executions: readonly string[];
  replay_validations: readonly string[];
  replay_drift_events: readonly ReplayDriftFailure[];
  deterministic_failures: readonly ReplayDriftFailure[];
  reconstruction_events: readonly string[];
  governance_reviews: readonly string[];
  certification_outcomes: readonly string[];
  containment_actions: readonly string[];
  replay_recoveries: readonly string[];
  operator_reviews: readonly string[];
  integrity_hash: string;
}>;

export type ReplayDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  replay_version: string;
  drift_category: string;
  replay_drift_score: number;
  replay_integrity_score: number;
  determinism_score: number;
  reconstruction_score: number;
  behavioral_consistency_score: number;
  severity: DriftSeverity;
  affected_replay_refs: readonly string[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  containment_required: boolean;
  governance_impact: string;
  certification_impact: string;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type ReplayDriftMetrics = Readonly<{
  replay_drift_score: number;
  replay_integrity_score: number;
  determinism_score: number;
  reconstruction_score: number;
  behavioral_consistency_score: number;
  containment_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_preserved: boolean;
  certification_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly ReplayDriftFailure[];
  integrity_hash: string;
}>;

export type ReplayDriftApiSurface = Readonly<{
  api_id: string;
  detect_replay_drift: "POST /replay-drift-detection/detect";
  retrieve_baseline: "POST /replay-drift-detection/baseline";
  retrieve_consistency: "POST /replay-drift-detection/consistency";
  retrieve_behavioral: "POST /replay-drift-detection/behavioral";
  retrieve_reconstruction: "POST /replay-drift-detection/reconstruction";
  retrieve_determinism: "POST /replay-drift-detection/determinism";
  retrieve_stability: "POST /replay-drift-detection/stability";
  retrieve_assessment: "POST /replay-drift-detection/assessment";
  retrieve_timeline: "POST /replay-drift-detection/timeline";
  retrieve_ledger_record: "POST /replay-drift-detection/ledger";
  retrieve_metrics: "POST /replay-drift-detection/metrics";
  replay_detection: "POST /replay-drift-detection/replay";
  inspect_detection: "POST /replay-drift-detection/inspect";
  retrieve_contract: "GET /replay-drift-detection/contract";
  production_mutation_supported: false;
  replay_change_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ReplayDriftInput = Readonly<{
  scenario?: ReplayDriftScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type ReplayDriftResult = Readonly<{
  replay_drift_detection_version: "replay-drift-detection/v1";
  detection_identifier: "ReplayDriftDetection";
  status: ReplayDriftStatus;
  api_surface: ReplayDriftApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: ReplayBaseline;
  consistency_report: ReplayConsistencyReport;
  behavioral_report: BehavioralConsistencyReport;
  reconstruction_report: ReplayReconstructionReport;
  determinism_report: DeterminismVerificationReport;
  stability_report: ReplayStabilityReport;
  integrity_assessment: ReplayIntegrityAssessment;
  timeline: ReplayDriftTimeline;
  drift_record: ReplayDriftRecord;
  metrics: ReplayDriftMetrics;
  failures: readonly ReplayDriftFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  certification_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_behavior: false;
  authorizes_replay_change: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ReplayDriftFoundation = Readonly<{
  replay_drift_detection_version: "replay-drift-detection/v1";
  api_surface: ReplayDriftApiSurface;
  result: ReplayDriftResult;
}>;
