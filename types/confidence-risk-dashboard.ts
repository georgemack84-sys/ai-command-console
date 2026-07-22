import type { AdaptiveDashboardResult, DashboardRole } from "@/types/adaptive-dashboard-foundation";

export type ConfidenceRiskDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type ConfidenceRiskValidationOutcome = "VALID" | "INVALID";
export type ConfidenceRiskDomain = "CONFIDENCE_CALIBRATION" | "CONFIDENCE_DRIFT" | "EVIDENCE_RELIABILITY" | "RISK_ADAPTATION" | "RISK_SEVERITY" | "RISK_PROBABILITY" | "RISK_ACTUALIZATION" | "GOVERNANCE_SENSITIVE_RISK" | "CONFIDENCE_RISK_COMPARISON";
export type CalibrationCategory = "well calibrated" | "overconfident" | "underconfident" | "falsely certain" | "falsely cautious" | "unstable" | "evidence inflated" | "evidence insufficient" | "unknown uncertainty" | "calibration not yet measurable";
export type DriftSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type DriftStatus = "NOT_DETECTED" | "SUSPECTED" | "DETECTED" | "UNDER_REVIEW" | "CONTAINED" | "REMEDIATED" | "CERTIFIED_RESOLVED" | "RECURRED";
export type EvidenceReliabilityState = "VERIFIED" | "RELIABLE" | "CONDITIONALLY_RELIABLE" | "INCOMPLETE" | "STALE" | "CONFLICTING" | "UNVERIFIED" | "SUSPECTED_POISONING" | "REJECTED";
export type AdaptationProposalState = "DRAFT" | "EVIDENCE_PENDING" | "ANALYSIS_COMPLETE" | "GOVERNANCE_REVIEW_REQUIRED" | "SIMULATION_REQUIRED" | "SIMULATION_IN_PROGRESS" | "OPERATOR_REVIEW_REQUIRED" | "CERTIFICATION_PENDING" | "CERTIFIED" | "REJECTED" | "DEFERRED" | "SUPERSEDED" | "ROLLBACK_REQUIRED";
export type RiskSeverityLevel = "NEGLIGIBLE" | "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL" | "CATASTROPHIC";
export type RiskActualizationOutcome = "NOT_ACTUALIZED" | "PARTIALLY_ACTUALIZED" | "FULLY_ACTUALIZED" | "MORE_SEVERE_THAN_PREDICTED" | "LESS_SEVERE_THAN_PREDICTED" | "DIFFERENT_CATEGORY_ACTUALIZED" | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";
export type GovernanceSensitiveRiskCategory = "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_CONFLICT" | "AUTHORITY_EXPANSION" | "TENANT_ISOLATION_FAILURE" | "UNAUTHORIZED_EXECUTION" | "OPERATOR_AUTHORITY_REDUCTION" | "AUDIT_DEGRADATION" | "REPLAY_INTEGRITY_FAILURE" | "EVIDENCE_TAMPERING" | "CERTIFICATION_BYPASS" | "POLICY_CONFLICT" | "NON_WAIVABLE_RISK";
export type ConfidenceRiskAlertSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ConfidenceRiskWidget = "Confidence Trend" | "Calibration Timeline" | "Risk Trend" | "Severity Distribution" | "Probability Distribution" | "Historical Comparison" | "Evidence Reliability" | "Proposal Status" | "Replay Explorer" | "Alert Center";

export type ConfidenceRiskDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "CONFIDENCE_HIDDEN"
  | "RISK_HIDDEN"
  | "NONDETERMINISTIC_RENDERING"
  | "MISSING_OUTCOME"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_SIMULATION"
  | "MISSING_OPERATOR_DECISION"
  | "MISSING_CERTIFICATION"
  | "MISSING_REPLAY"
  | "MISSING_ROLLBACK"
  | "UNSUPPORTED_CONFIDENCE"
  | "UNSUPPORTED_RISK"
  | "GOVERNANCE_RISK_HIDDEN"
  | "DOMAIN_COLLAPSED"
  | "UNAUTHORIZED_ROLE"
  | "TENANT_LEAK"
  | "RESTRICTED_FIELD_LEAK"
  | "INTEGRITY_FAILURE"
  | "WRITE_AUTHORITY_EXPOSED";

export type ConfidenceRiskDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "CONFIDENCE_RECORD_HIDDEN"
  | "RISK_RECORD_HIDDEN"
  | "DASHBOARD_RENDERING_NONDETERMINISTIC"
  | "OUTCOME_LINK_MISSING"
  | "EVIDENCE_REFERENCE_BROKEN"
  | "GOVERNANCE_LINEAGE_MISSING"
  | "SIMULATION_STATUS_MISSING"
  | "OPERATOR_DECISION_MISSING"
  | "CERTIFICATION_STATUS_MISSING"
  | "REPLAY_READINESS_MISSING"
  | "ROLLBACK_READINESS_MISSING"
  | "UNSUPPORTED_CONFIDENCE_CLAIM"
  | "UNSUPPORTED_RISK_CLAIM"
  | "GOVERNANCE_SENSITIVE_RISK_HIDDEN"
  | "CONFIDENCE_RISK_DOMAIN_COLLAPSED"
  | "UNAUTHORIZED_DASHBOARD_ACCESS"
  | "TENANT_ISOLATION_VIOLATED"
  | "RESTRICTED_FIELD_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DASHBOARD_WRITE_AUTHORITY_EXPOSED";

export type ConfidenceRiskDashboardRecord = Readonly<{
  dashboard_record_id: string;
  tenant_id: string;
  mission_scope: string;
  dashboard_view: string;
  intelligence_domain: ConfidenceRiskDomain;
  related_domains: readonly ConfidenceRiskDomain[];
  source_record_refs: readonly string[];
  confidence_record_refs: readonly string[];
  risk_record_refs: readonly string[];
  outcome_record_refs: readonly string[];
  evidence_refs: readonly string[];
  adaptation_proposal_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_refs: readonly string[];
  operator_decision_refs: readonly string[];
  certification_refs: readonly string[];
  replay_refs: readonly string[];
  rollback_refs: readonly string[];
  current_confidence_state: string;
  current_risk_state: string;
  calibration_status: CalibrationCategory;
  drift_status: DriftStatus;
  evidence_reliability: EvidenceReliabilityState;
  governance_sensitivity: GovernanceSensitiveRiskCategory | "NONE";
  visible_to_roles: readonly DashboardRole[];
  restricted_fields: readonly string[];
  summary: string;
  current_status: AdaptationProposalState;
  alerts: readonly string[];
  integrity_hash: string;
}>;

export type ConfidenceCalibrationView = Readonly<{ view_id: string; predicted_confidence: number; realized_outcome: string; calibration_error: number; confidence_accuracy: number; calibration_status: CalibrationCategory; confidence_category: string; affected_mission: string; evidence_quality: EvidenceReliabilityState; adaptation_status: AdaptationProposalState; certification_status: string; integrity_hash: string }>;
export type ConfidenceTrendView = Readonly<{ view_id: string; confidence_trend: readonly string[]; calibration_accuracy_trend: readonly string[]; overconfidence_trend: readonly string[]; underconfidence_trend: readonly string[]; confidence_variance: number; confidence_stability: number; distinguishes_raw_normalized_calibrated: boolean; deterministic: boolean; integrity_hash: string }>;
export type CalibrationTimeline = Readonly<{ timeline_id: string; events: readonly string[]; preserves_event_ordering: boolean; preserves_original_values: boolean; exposes_superseded_and_rejected: boolean; replay_refs: readonly string[]; integrity_hash: string }>;
export type ConfidenceDriftView = Readonly<{ view_id: string; severity: DriftSeverity; status: DriftStatus; drift_signals: readonly string[]; affected_missions: readonly string[]; governance_refs: readonly string[]; certification_status: string; integrity_hash: string }>;
export type EvidenceReliabilityView = Readonly<{ view_id: string; reliability_state: EvidenceReliabilityState; evidence_sources: readonly string[]; completeness: number; freshness: string; consistency: string; independence: string; conflicts: readonly string[]; missing_evidence: readonly string[]; unsupported_claims: readonly string[]; integrity_hash: string }>;
export type ConfidenceAdaptationProposalView = Readonly<{ view_id: string; proposal_refs: readonly string[]; current_behavior: string; proposed_change: string; affected_category: CalibrationCategory; expected_benefit: string; expected_risk: string; governance_implications: readonly string[]; simulation_status: string; approval_status: string; certification_status: string; rollback_readiness: string; integrity_hash: string }>;
export type RiskAdaptationView = Readonly<{ view_id: string; current_risk_assessment: string; realized_risk: string; assessment_error: number; affected_risk_category: string; probability_accuracy: number; severity_accuracy: number; mitigation_effectiveness: number; residual_risk: string; adaptation_status: AdaptationProposalState; governance_sensitivity: GovernanceSensitiveRiskCategory | "NONE"; certification_status: string; integrity_hash: string }>;
export type RiskSeverityView = Readonly<{ view_id: string; predicted_severity: RiskSeverityLevel; realized_severity: RiskSeverityLevel; severity_variance: string; canonical_taxonomy: readonly RiskSeverityLevel[]; mapping_rule: string; mapping_version: string; integrity_hash: string }>;
export type RiskProbabilityView = Readonly<{ view_id: string; predicted_probability: number; observed_occurrence: boolean; probability_error: number; confidence_interval: string; evidence_strength: number; historical_frequency: number; representation_types: readonly string[]; unsupported_precision_displayed: false; integrity_hash: string }>;
export type RiskActualizationExplorer = Readonly<{ view_id: string; outcome: RiskActualizationOutcome; chronological_events: readonly string[]; mitigation_effectiveness: number; residual_effects: readonly string[]; rollback_outcome: string; adaptive_proposal_refs: readonly string[]; integrity_hash: string }>;
export type GovernanceSensitiveRiskView = Readonly<{ view_id: string; categories: readonly GovernanceSensitiveRiskCategory[]; required_escalations: readonly string[]; formal_disposition_required: boolean; hidden_by_aggregation: false; downgraded_by_confidence_only: false; integrity_hash: string }>;
export type ConfidenceRiskComparisonWorkspace = Readonly<{ workspace_id: string; dimensions: readonly string[]; separate_confidence_and_risk_scales: true; unsupported_composite_score: false; missing_data: readonly string[]; uncertainty_notes: readonly string[]; normalization_methods: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type AdaptiveProposalStatusPanel = Readonly<{ panel_id: string; confidence_proposals: readonly string[]; risk_proposals: readonly string[]; cross_domain_proposals: readonly string[]; queue_categories: readonly string[]; next_required_actions: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type ConfidenceRiskReplayExplorer = Readonly<{ replay_id: string; replay_scope: readonly string[]; event_ordering_verified: boolean; evidence_lineage_verified: boolean; calculation_reproducible: boolean; decision_lineage_complete: boolean; tenant_context_verified: boolean; output_hash_verified: boolean; integrity_hash: string }>;
export type CalibrationRiskAlertCenter = Readonly<{ alert_id: string; confidence_alerts: readonly string[]; risk_alerts: readonly string[]; integrity_alerts: readonly string[]; highest_severity: ConfidenceRiskAlertSeverity; critical_conditions_visible: boolean; integrity_hash: string }>;
export type ConfidenceRiskPermission = Readonly<{ permission_id: string; role: DashboardRole; tenant_id: string; allowed: boolean; restricted_fields: readonly string[]; tenant_isolated: boolean; evidence_authorized: boolean; governance_authorized: boolean; replay_authorized: boolean; certification_authorized: boolean; integrity_hash: string }>;
export type ConfidenceRiskMetrics = Readonly<{ dashboard_rendering_latency_ms: number; confidence_sync_latency_ms: number; risk_sync_latency_ms: number; stale_calibration_records: number; stale_risk_records: number; missing_outcome_links: number; missing_evidence_references: number; broken_replay_links: number; inconsistent_proposal_states: number; inconsistent_certification_states: number; widget_rendering_failures: number; unauthorized_access_attempts: number; tenant_isolation_violations: number; integrity_verification_failures: number; hidden_state_discrepancies: number; integrity_hash: string }>;
export type ConfidenceRiskValidationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: ConfidenceRiskDashboardFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type ConfidenceRiskDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /confidence-risk-dashboard/dashboard";
  retrieve_contract: "GET /confidence-risk-dashboard/contract";
  retrieve_calibration: "POST /confidence-risk-dashboard/calibration";
  retrieve_trends: "POST /confidence-risk-dashboard/trends";
  retrieve_timeline: "POST /confidence-risk-dashboard/timeline";
  retrieve_drift: "POST /confidence-risk-dashboard/drift";
  retrieve_evidence: "POST /confidence-risk-dashboard/evidence";
  retrieve_confidence_proposals: "POST /confidence-risk-dashboard/confidence-proposals";
  retrieve_risk_adaptation: "POST /confidence-risk-dashboard/risk-adaptation";
  retrieve_severity: "POST /confidence-risk-dashboard/severity";
  retrieve_probability: "POST /confidence-risk-dashboard/probability";
  retrieve_actualization: "POST /confidence-risk-dashboard/actualization";
  retrieve_governance_risk: "POST /confidence-risk-dashboard/governance-risk";
  retrieve_comparison: "POST /confidence-risk-dashboard/comparison";
  retrieve_proposals: "POST /confidence-risk-dashboard/proposals";
  retrieve_replay: "POST /confidence-risk-dashboard/replay";
  retrieve_alerts: "POST /confidence-risk-dashboard/alerts";
  validate_dashboard: "POST /confidence-risk-dashboard/validate";
  inspect_dashboard: "POST /confidence-risk-dashboard/inspect";
  creation_supported: false;
  mutation_supported: false;
  confidence_recalibration_supported: false;
  risk_model_mutation_supported: false;
  threshold_mutation_supported: false;
  proposal_approval_supported: false;
  simulation_bypass_supported: false;
  rollback_execution_supported: false;
  authority_expansion_supported: false;
  integrity_hash: string;
}>;

export type ConfidenceRiskDashboardInput = Readonly<{ scenario?: ConfidenceRiskDashboardScenario; role?: DashboardRole; tenant_id?: string }>;

export type ConfidenceRiskDashboardResult = Readonly<{
  confidence_risk_dashboard_version: "confidence-risk-dashboard/v10.14.6";
  dashboard_identifier: "ConfidenceRiskDashboard";
  status: ConfidenceRiskDashboardStatus;
  api_surface: ConfidenceRiskDashboardApiSurface;
  dashboard_foundation: AdaptiveDashboardResult;
  records: readonly ConfidenceRiskDashboardRecord[];
  calibration_view: ConfidenceCalibrationView;
  trend_view: ConfidenceTrendView;
  timeline: CalibrationTimeline;
  drift_view: ConfidenceDriftView;
  evidence_view: EvidenceReliabilityView;
  confidence_proposal_view: ConfidenceAdaptationProposalView;
  risk_adaptation_view: RiskAdaptationView;
  severity_view: RiskSeverityView;
  probability_view: RiskProbabilityView;
  actualization_explorer: RiskActualizationExplorer;
  governance_risk_view: GovernanceSensitiveRiskView;
  comparison_workspace: ConfidenceRiskComparisonWorkspace;
  proposal_status_panel: AdaptiveProposalStatusPanel;
  replay_explorer: ConfidenceRiskReplayExplorer;
  alert_center: CalibrationRiskAlertCenter;
  permissions: readonly ConfidenceRiskPermission[];
  widgets: readonly ConfidenceRiskWidget[];
  metrics: ConfidenceRiskMetrics;
  validation_tests: readonly ConfidenceRiskValidationTest[];
  validation_outcome: ConfidenceRiskValidationOutcome;
  failures: readonly ConfidenceRiskDashboardFailure[];
  deterministic: boolean;
  replayable: boolean;
  tenant_isolated: boolean;
  evidence_backed: boolean;
  governance_visible: boolean;
  confidence_visible: boolean;
  risk_visible: boolean;
  domains_separate: boolean;
  read_only: true;
  advisory_only: true;
  write_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ConfidenceRiskDashboardValidationResult = Readonly<{ dashboard_id: string | null; valid: boolean; validation_outcome: ConfidenceRiskValidationOutcome; failures: readonly ConfidenceRiskDashboardFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; read_only: boolean; validation_hash: string }>;
export type ConfidenceRiskDashboardObservabilitySurface = Readonly<{ dashboard_id: string; status: ConfidenceRiskDashboardStatus; validation_outcome: ConfidenceRiskValidationOutcome; records: number; failed_tests: number; failures: readonly ConfidenceRiskDashboardFailure[]; replayable: boolean; tenant_isolated: boolean; read_only: boolean; integrity_hash: string }>;
export type ConfidenceRiskDashboardContract = Readonly<{ doctrine: Readonly<{ version: "confidence-risk-dashboard/v10.14.6"; widgets: readonly ConfidenceRiskWidget[]; domains: readonly ConfidenceRiskDomain[]; navigation_dimensions: readonly string[]; required_data_sources: readonly string[]; read_only: true; advisory_only: true }>; result: ConfidenceRiskDashboardResult; validation: ConfidenceRiskDashboardValidationResult; observability: ConfidenceRiskDashboardObservabilitySurface }>;
