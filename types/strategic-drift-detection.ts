import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type StrategicDriftStatus = "PASS" | "DRIFT_DETECTED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type StrategicDriftFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_STRATEGY_CHANGE"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "CONSTITUTIONAL_CONFLICT"
  | "NONDETERMINISTIC_CLASSIFICATION"
  | "UNEXPLAINED_STRATEGIC_DRIFT"
  | "NONREPLAYABLE_EVIDENCE"
  | "HIDDEN_OPTIMIZATION_DETECTED"
  | "OBJECTIVE_SUBSTITUTION_DETECTED"
  | "RECOMMENDATION_BIAS_DETECTED"
  | "GOVERNANCE_SENSITIVITY_REDUCTION"
  | "CONSTITUTIONAL_SENSITIVITY_REDUCTION"
  | "TENANT_ISOLATION_BREACH"
  | "PRODUCTION_MUTATION_ATTEMPT"
  | "UNKNOWN_STRATEGIC_BEHAVIOR";

export type StrategicDriftScenario =
  | "BASELINE"
  | "UNAUTHORIZED_STRATEGY_CHANGE"
  | "MISSING_GOVERNANCE_APPROVAL"
  | "CONSTITUTIONAL_CONFLICT"
  | "NONDETERMINISTIC"
  | "UNEXPLAINED_DRIFT"
  | "NONREPLAYABLE_EVIDENCE"
  | "HIDDEN_OPTIMIZATION"
  | "OBJECTIVE_SUBSTITUTION"
  | "RECOMMENDATION_BIAS"
  | "GOVERNANCE_SENSITIVITY_REDUCTION"
  | "CONSTITUTIONAL_SENSITIVITY_REDUCTION"
  | "TENANT_BREACH"
  | "PRODUCTION_MUTATION"
  | "UNKNOWN_STRATEGY";

export type StrategicBaseline = Readonly<{
  baseline_id: string;
  strategy_version: string;
  mission_scope: string;
  approved_priorities: readonly string[];
  decision_weights: readonly string[];
  optimization_constraints: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type StrategyComparison = Readonly<{
  comparison_id: string;
  strategy_difference_matrix: readonly string[];
  priority_shift_report: string;
  objective_alignment_report: string;
  strategic_consistency_score: number;
  integrity_hash: string;
}>;

export type RecommendationPhilosophyProfile = Readonly<{
  profile_id: string;
  evaluated_dimensions: readonly string[];
  philosophy_drift_report: string;
  behavioral_consistency_analysis: string;
  philosophy_stability_score: number;
  integrity_hash: string;
}>;

export type HiddenOptimizationAssessment = Readonly<{
  assessment_id: string;
  detected_patterns: readonly string[];
  objective_shift_analysis: string;
  optimization_risk_report: string;
  hidden_optimization_score: number;
  integrity_hash: string;
}>;

export type StrategicStabilityAnalysis = Readonly<{
  analysis_id: string;
  strategic_stability_score: number;
  stability_timeline: readonly string[];
  drift_trend_analysis: string;
  integrity_hash: string;
}>;

export type StrategyVarianceReport = Readonly<{
  report_id: string;
  strategic_distance: number;
  priority_variance: number;
  objective_variance: number;
  recommendation_variance: number;
  governance_variance: number;
  policy_variance: number;
  optimization_variance: number;
  variance_timeline: readonly string[];
  strategic_divergence_matrix: readonly string[];
  integrity_hash: string;
}>;

export type StrategicDriftEvidencePackage = Readonly<{
  supporting_recommendations: readonly string[];
  affected_missions: readonly string[];
  baseline_comparisons: readonly string[];
  decision_lineage: readonly string[];
  governance_evaluations: readonly string[];
  constitutional_evaluations: readonly string[];
  replay_references: readonly string[];
  operator_decisions: readonly string[];
  simulation_outcomes: readonly string[];
  historical_trend_analysis: string;
  immutable: true;
  deterministic: true;
  replayable: true;
  cryptographically_verifiable: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type StrategicDriftRecord = Readonly<{
  drift_id: string;
  tenant_id: string;
  baseline_ref: string;
  strategy_version: string;
  drift_category: "STRATEGIC_DRIFT";
  drift_score: number;
  variance_score: number;
  stability_score: number;
  severity: DriftSeverity;
  affected_recommendations: readonly string[];
  affected_decisions: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  containment_required: boolean;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type OperatorVisibilityInterface = Readonly<{
  displayed_fields: readonly string[];
  operator_capabilities: readonly string[];
  governance_impact_visible: true;
  constitutional_impact_visible: true;
  replay_links_visible: true;
  integrity_hash: string;
}>;

export type StrategicDriftMetrics = Readonly<{
  strategic_drift_score: number;
  variance_score: number;
  stability_score: number;
  philosophy_stability_score: number;
  hidden_optimization_score: number;
  deterministic_classification: boolean;
  replayable_detection: boolean;
  governance_aligned: boolean;
  constitutional_aligned: boolean;
  tenant_isolated: boolean;
  failures: readonly StrategicDriftFailure[];
  integrity_hash: string;
}>;

export type StrategicDriftApiSurface = Readonly<{
  api_id: string;
  detect_strategic_drift: "POST /strategic-drift-detection/detect";
  retrieve_baseline: "POST /strategic-drift-detection/baseline";
  retrieve_comparison: "POST /strategic-drift-detection/comparison";
  retrieve_evidence: "POST /strategic-drift-detection/evidence";
  retrieve_metrics: "POST /strategic-drift-detection/metrics";
  replay_detection: "POST /strategic-drift-detection/replay";
  inspect_detector: "POST /strategic-drift-detection/inspect";
  retrieve_contract: "GET /strategic-drift-detection/contract";
  production_mutation_supported: false;
  autonomous_containment_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type StrategicDriftInput = Readonly<{
  scenario?: StrategicDriftScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type StrategicDriftDetectionResult = Readonly<{
  strategic_drift_detection_version: "strategic-drift-detection/v1";
  detector_identifier: "StrategicDriftDetection";
  status: StrategicDriftStatus;
  api_surface: StrategicDriftApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: StrategicBaseline;
  comparison: StrategyComparison;
  philosophy_profile: RecommendationPhilosophyProfile;
  hidden_optimization: HiddenOptimizationAssessment;
  stability_analysis: StrategicStabilityAnalysis;
  variance_report: StrategyVarianceReport;
  evidence_package: StrategicDriftEvidencePackage;
  drift_record: StrategicDriftRecord;
  operator_visibility: OperatorVisibilityInterface;
  metrics: StrategicDriftMetrics;
  failures: readonly StrategicDriftFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  authorizes_production_change: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategicDriftFoundation = Readonly<{
  strategic_drift_detection_version: "strategic-drift-detection/v1";
  api_surface: StrategicDriftApiSurface;
  result: StrategicDriftDetectionResult;
}>;
