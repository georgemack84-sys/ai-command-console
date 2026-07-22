import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type OptimizationPressureStatus = "PASS" | "PRESSURE_DETECTED" | "SUPPRESSED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type OptimizationPressureFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_OBJECTIVE_CHANGE"
  | "REWARD_HACKING_DETECTED"
  | "OVER_OPTIMIZATION_DETECTED"
  | "METRIC_GAMING_DETECTED"
  | "CONFIDENCE_MAXIMIZATION_DETECTED"
  | "GOVERNANCE_MINIMIZATION_DETECTED"
  | "SHORTCUT_LEARNING_DETECTED"
  | "OPTIMIZATION_IMBALANCE_DETECTED"
  | "OBJECTIVE_SUBSTITUTION_DETECTED"
  | "OPTIMIZATION_DRIFT_DETECTED"
  | "ADAPTIVE_OPTIMIZATION_BIAS"
  | "OPTIMIZATION_INSTABILITY_DETECTED"
  | "PERFORMANCE_ONLY_OPTIMIZATION"
  | "REPLAY_REDUCTION_DETECTED"
  | "EXPLAINABILITY_DEGRADATION_DETECTED"
  | "AUDIT_REDUCTION_DETECTED"
  | "CERTIFICATION_AVOIDANCE_DETECTED"
  | "CONSTITUTIONAL_TRADEOFF_DETECTED"
  | "OPERATOR_AUTHORITY_WEAKENING"
  | "NONDETERMINISTIC_ASSESSMENT"
  | "NONREPLAYABLE_OPTIMIZATION_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_OPTIMIZATION_BEHAVIOR";

export type OptimizationPressureScenario =
  | "BASELINE"
  | "UNAUTHORIZED_OBJECTIVE_CHANGE"
  | "REWARD_HACKING"
  | "OVER_OPTIMIZATION"
  | "METRIC_GAMING"
  | "CONFIDENCE_MAXIMIZATION"
  | "GOVERNANCE_MINIMIZATION"
  | "SHORTCUT_LEARNING"
  | "OPTIMIZATION_IMBALANCE"
  | "OBJECTIVE_SUBSTITUTION"
  | "OPTIMIZATION_DRIFT"
  | "ADAPTIVE_OPTIMIZATION_BIAS"
  | "OPTIMIZATION_INSTABILITY"
  | "PERFORMANCE_ONLY"
  | "REPLAY_REDUCTION"
  | "EXPLAINABILITY_DEGRADATION"
  | "AUDIT_REDUCTION"
  | "CERTIFICATION_AVOIDANCE"
  | "CONSTITUTIONAL_TRADEOFF"
  | "OPERATOR_AUTHORITY_WEAKENING"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type OptimizationBaseline = Readonly<{
  baseline_id: string;
  optimization_policy_version: string;
  approved_objectives: readonly string[];
  protected_constraints: readonly string[];
  optimization_boundaries: readonly string[];
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  replay_requirements: readonly string[];
  explainability_requirements: readonly string[];
  approval_reference: string;
  effective_date: string;
  integrity_hash: string;
}>;

export type ObjectiveAlignmentReport = Readonly<{
  report_id: string;
  mission_alignment_score: number;
  strategic_alignment_score: number;
  governance_alignment_score: number;
  constitutional_alignment_score: number;
  operator_alignment_score: number;
  evidence_alignment_score: number;
  certification_alignment_score: number;
  long_term_consistency_score: number;
  strategic_consistency_assessment: string;
  alignment_variance_summary: string;
  integrity_hash: string;
}>;

export type RewardHackingAssessment = Readonly<{
  assessment_id: string;
  reward_hacking_detected: boolean;
  incentive_integrity_report: string;
  detected_reward_patterns: readonly OptimizationPressureFailure[];
  automatic_suppression: readonly string[];
  integrity_hash: string;
}>;

export type MetricIntegrityReport = Readonly<{
  report_id: string;
  metric_consistency_score: number;
  metric_distribution_score: number;
  historical_comparison_score: number;
  optimization_trend_score: number;
  evidence_correlation_score: number;
  outcome_correlation_score: number;
  measurement_stability_score: number;
  metric_gaming_assessment: string;
  detected_metric_anomalies: readonly OptimizationPressureFailure[];
  integrity_hash: string;
}>;

export type GovernanceTradeoffReport = Readonly<{
  report_id: string;
  governance_tradeoff_report: string;
  constitutional_impact_assessment: string;
  governance_preservation_score: number;
  replay_preservation_score: number;
  explainability_preservation_score: number;
  audit_preservation_score: number;
  certification_preservation_score: number;
  detected_tradeoffs: readonly OptimizationPressureFailure[];
  automatic_suppression: readonly string[];
  integrity_hash: string;
}>;

export type OptimizationBalanceReport = Readonly<{
  report_id: string;
  performance_score: number;
  governance_score: number;
  safety_score: number;
  explainability_score: number;
  replayability_score: number;
  auditability_score: number;
  operator_visibility_score: number;
  evidence_quality_score: number;
  certification_readiness_score: number;
  optimization_balance_report: string;
  balance_stability_assessment: string;
  integrity_hash: string;
}>;

export type OptimizationIntegrityScoreReport = Readonly<{
  score_id: string;
  objective_alignment_score: number;
  governance_preservation_score: number;
  constitutional_compliance_score: number;
  replay_preservation_score: number;
  explainability_score: number;
  balance_score: number;
  optimization_integrity_score: number;
  integrity_hash: string;
}>;

export type OptimizationPressureAssessment = Readonly<{
  assessment_id: string;
  pressure_detected: boolean;
  detected_behaviors: readonly OptimizationPressureFailure[];
  affected_objectives: readonly string[];
  reward_analysis: string;
  metric_analysis: string;
  governance_impacts: readonly string[];
  constitutional_impacts: readonly string[];
  replay_impacts: readonly string[];
  explainability_impacts: readonly string[];
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

export type OptimizationRiskSummary = Readonly<{
  summary_id: string;
  operational_risk: string;
  governance_risk: string;
  constitutional_risk: string;
  strategic_risk: string;
  production_readiness_impact: string;
  integrity_hash: string;
}>;

export type OptimizationSuppressionDecision = Readonly<{
  suppression_id: string;
  suppressed_behaviors: readonly string[];
  containment_actions: readonly string[];
  governance_review_required: boolean;
  operator_notification_required: boolean;
  forensic_evidence_preserved: true;
  fail_closed: boolean;
  integrity_hash: string;
}>;

export type OptimizationPressureRecord = Readonly<{
  optimization_event_id: string;
  tenant_id: string;
  optimization_policy_version: string;
  optimization_type: "OPTIMIZATION_PRESSURE";
  optimization_integrity_score: number;
  objective_alignment_score: number;
  governance_preservation_score: number;
  severity: DriftSeverity;
  affected_objectives: readonly string[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  supporting_evidence: string;
  suppressed_behaviors: readonly string[];
  recommended_response: DriftResponse;
  containment_required: boolean;
  governance_impact: string;
  constitutional_impact: string;
  replay_impact: string;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type OptimizationPressureMetrics = Readonly<{
  optimization_integrity_score: number;
  objective_alignment_score: number;
  governance_preservation_score: number;
  constitutional_compliance_score: number;
  replay_preservation_score: number;
  explainability_score: number;
  containment_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly OptimizationPressureFailure[];
  integrity_hash: string;
}>;

export type OptimizationPressureApiSurface = Readonly<{
  api_id: string;
  defend_optimization_pressure: "POST /optimization-pressure-defense/defend";
  retrieve_baseline: "POST /optimization-pressure-defense/baseline";
  retrieve_objective_alignment: "POST /optimization-pressure-defense/objective-alignment";
  retrieve_reward_hacking: "POST /optimization-pressure-defense/reward-hacking";
  retrieve_metric_integrity: "POST /optimization-pressure-defense/metric-integrity";
  retrieve_governance_tradeoff: "POST /optimization-pressure-defense/governance-tradeoff";
  retrieve_balance_report: "POST /optimization-pressure-defense/balance";
  retrieve_integrity_score: "POST /optimization-pressure-defense/integrity-score";
  retrieve_assessment: "POST /optimization-pressure-defense/assessment";
  retrieve_risk_summary: "POST /optimization-pressure-defense/risk-summary";
  retrieve_suppression: "POST /optimization-pressure-defense/suppression";
  retrieve_ledger_record: "POST /optimization-pressure-defense/ledger";
  retrieve_metrics: "POST /optimization-pressure-defense/metrics";
  replay_defense: "POST /optimization-pressure-defense/replay";
  inspect_defense: "POST /optimization-pressure-defense/inspect";
  retrieve_contract: "GET /optimization-pressure-defense/contract";
  production_mutation_supported: false;
  optimization_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type OptimizationPressureInput = Readonly<{
  scenario?: OptimizationPressureScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type OptimizationPressureResult = Readonly<{
  optimization_pressure_defense_version: "optimization-pressure-defense/v1";
  defense_identifier: "OptimizationPressureDefense";
  status: OptimizationPressureStatus;
  api_surface: OptimizationPressureApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  baseline: OptimizationBaseline;
  objective_alignment_report: ObjectiveAlignmentReport;
  reward_hacking_assessment: RewardHackingAssessment;
  metric_integrity_report: MetricIntegrityReport;
  governance_tradeoff_report: GovernanceTradeoffReport;
  balance_report: OptimizationBalanceReport;
  integrity_score_report: OptimizationIntegrityScoreReport;
  pressure_assessment: OptimizationPressureAssessment;
  risk_summary: OptimizationRiskSummary;
  suppression_decision: OptimizationSuppressionDecision;
  optimization_record: OptimizationPressureRecord;
  metrics: OptimizationPressureMetrics;
  failures: readonly OptimizationPressureFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_behavior: false;
  authorizes_optimization: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OptimizationPressureFoundation = Readonly<{
  optimization_pressure_defense_version: "optimization-pressure-defense/v1";
  api_surface: OptimizationPressureApiSurface;
  result: OptimizationPressureResult;
}>;
