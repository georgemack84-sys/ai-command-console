import type { DashboardRole } from "@/types/adaptive-dashboard-foundation";

export type OperatorImpactDashboardStatus = "AUTHORITATIVE" | "REJECTED";
export type OperatorImpactValidationOutcome = "VALID" | "INVALID";
export type OperatorScopeType = "INDIVIDUAL_OPERATOR" | "OPERATOR_ROLE" | "OPERATOR_TEAM" | "MISSION_OPERATOR_GROUP" | "TENANT_OPERATOR_GROUP" | "PSEUDONYMIZED_COHORT" | "SYSTEM_WIDE_AGGREGATE";
export type OperatorImpactPatternCategory = "RECURRING_OVERRIDE" | "RECURRING_REJECTION" | "RECURRING_APPROVAL" | "RECURRING_DEFERMENT" | "REVIEW_LATENCY_INCREASE" | "REVIEW_LATENCY_DECREASE" | "DECISION_INCONSISTENCY" | "DECISION_STABILITY" | "WORKLOAD_CONCENTRATION" | "WORKLOAD_IMBALANCE" | "HIGH_ESCALATION_RATE" | "LOW_RECOMMENDATION_USABILITY" | "EVIDENCE_REVIEW_DIFFICULTY" | "GOVERNANCE_FRICTION" | "MISSION_SPECIFIC_OPERATOR_PATTERN" | "ROLE_SPECIFIC_OPERATOR_PATTERN" | "POSSIBLE_TRAINING_GAP" | "POSSIBLE_INTERFACE_GAP" | "POSSIBLE_RECOMMENDATION_QUALITY_GAP" | "INSUFFICIENT_EVIDENCE";
export type OverrideCategory = "RISK_TOO_HIGH" | "RISK_TOO_LOW" | "INSUFFICIENT_EVIDENCE" | "INCORRECT_CONTEXT" | "GOVERNANCE_CONFLICT" | "CONSTITUTIONAL_CONFLICT" | "AUTHORITY_CONCERN" | "MISSION_PRIORITY_CONFLICT" | "RECOMMENDATION_NOT_USABLE" | "BETTER_OPERATOR_ALTERNATIVE" | "TIMING_CONSTRAINT" | "RESOURCE_CONSTRAINT" | "OTHER_DOCUMENTED_REASON" | "REASON_NOT_RECORDED";
export type ApprovalBehaviorCategory = "APPROVAL_STABLE" | "APPROVAL_INCREASING" | "APPROVAL_DECREASING" | "HIGH_CONDITIONAL_APPROVAL" | "HIGH_DEFERMENT" | "HIGH_ESCALATION" | "RISK_SENSITIVE_APPROVAL" | "EVIDENCE_SENSITIVE_APPROVAL" | "GOVERNANCE_SENSITIVE_APPROVAL" | "INCONSISTENT_APPROVAL_PATTERN" | "INSUFFICIENT_SAMPLE";
export type LatencyCategory = "WITHIN_EXPECTED_RANGE" | "IMPROVING" | "DEGRADING" | "HIGH_QUEUE_DELAY" | "HIGH_EVIDENCE_DELAY" | "HIGH_GOVERNANCE_DELAY" | "HIGH_OPERATOR_REVIEW_TIME" | "HIGH_SYSTEM_DELAY" | "BLOCKED_BY_DEPENDENCY" | "INSUFFICIENT_DATA";
export type ConsistencyState = "CONSISTENT" | "MOSTLY_CONSISTENT" | "CONTEXTUALLY_VARIABLE" | "POTENTIALLY_INCONSISTENT" | "INSUFFICIENT_COMPARABLE_CASES" | "UNDER_REVIEW";
export type WorkloadState = "BALANCED" | "MODERATELY_CONCENTRATED" | "HIGHLY_CONCENTRATED" | "OVERLOADED" | "UNDERUTILIZED" | "MISSION_DRIVEN_CONCENTRATION" | "ROLE_CONSTRAINED" | "INSUFFICIENT_DATA";
export type PrivacyClassification = "AGGREGATE" | "PSEUDONYMIZED" | "ROLE_VISIBLE" | "IDENTITY_VISIBLE_AUTHORIZED" | "RESTRICTED_INVESTIGATION" | "BLOCKED";
export type OperatorImpactAlertSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type OperatorImpactWidget = "Affected Operators" | "Operator Trends" | "Override Patterns" | "Approval Behavior" | "Review Latency" | "Operator Consistency" | "Workload Distribution" | "Comparison Workspace" | "Historical Trends" | "Replay Explorer" | "Context Panel" | "Alert Center";

export type OperatorImpactDashboardScenario =
  | "BASELINE"
  | "FOUNDATION_UNAVAILABLE"
  | "MISSING_TENANT"
  | "MISSION_SCOPE_UNVERIFIED"
  | "UNAUTHORIZED_IDENTITY_ACCESS"
  | "MISSING_PRIVACY_CLASSIFICATION"
  | "SPARSE_COHORT"
  | "AUTHORITY_CONTEXT_MISSING"
  | "RECOMMENDATION_VERSION_UNRESOLVED"
  | "MISSING_EVIDENCE"
  | "REPLAY_INTEGRITY_FAILURE"
  | "TENANT_LEAK"
  | "INCOMPARABLE_POPULATIONS"
  | "NONDETERMINISTIC_CALCULATION"
  | "RESTRICTED_FIELD_LEAK"
  | "HIDDEN_OPERATOR_PROFILING"
  | "OPERATOR_RANKING"
  | "COMPOSITE_SCORE"
  | "AUTHORITY_REDUCTION_EXPOSED"
  | "WORKLOAD_REASSIGNMENT_EXPOSED"
  | "DISCIPLINARY_ACTION_EXPOSED"
  | "INTEGRITY_FAILURE";

export type OperatorImpactDashboardFailure =
  | "DASHBOARD_FOUNDATION_UNAVAILABLE"
  | "TENANT_CONTEXT_UNAVAILABLE"
  | "MISSION_SCOPE_UNVERIFIED"
  | "OPERATOR_VISIBILITY_UNAUTHORIZED"
  | "PRIVACY_CLASSIFICATION_MISSING"
  | "MINIMUM_COHORT_SIZE_VIOLATED"
  | "AUTHORITY_CONTEXT_UNAVAILABLE"
  | "RECOMMENDATION_VERSION_UNRESOLVED"
  | "EVIDENCE_REFERENCE_INCOMPLETE"
  | "REPLAY_INTEGRITY_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "COMPARISON_POPULATIONS_NOT_COMPARABLE"
  | "CALCULATION_NONDETERMINISTIC"
  | "RESTRICTED_FIELD_EXPOSED"
  | "HIDDEN_OPERATOR_PROFILING_DETECTED"
  | "UNSUPPORTED_OPERATOR_RANKING"
  | "COMPOSITE_OPERATOR_SCORE_DETECTED"
  | "AUTHORITY_REDUCTION_EXPOSED"
  | "WORKLOAD_REASSIGNMENT_EXPOSED"
  | "DISCIPLINARY_ACTION_EXPOSED"
  | "INTEGRITY_VERIFICATION_FAILED";

export type OperatorImpactDashboardRecord = Readonly<{
  dashboard_record_id: string;
  tenant_id: string;
  mission_scope: string;
  pattern_id: string;
  pattern_version: string;
  operator_scope_type: OperatorScopeType;
  operator_refs: readonly string[];
  operator_role_refs: readonly string[];
  affected_mission_refs: readonly string[];
  recommendation_refs: readonly string[];
  outcome_refs: readonly string[];
  feedback_refs: readonly string[];
  governance_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  pattern_category: OperatorImpactPatternCategory;
  pattern_summary: string;
  behavior_metrics: readonly string[];
  override_metrics: readonly string[];
  approval_metrics: readonly string[];
  review_latency_metrics: readonly string[];
  consistency_metrics: readonly string[];
  workload_metrics: readonly string[];
  confidence_level: number;
  strategic_impact: "LOW" | "MODERATE" | "HIGH";
  governance_impact: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  privacy_classification: PrivacyClassification;
  visible_to_roles: readonly DashboardRole[];
  restricted_fields: readonly string[];
  current_status: "ACTIVE" | "UNDER_REVIEW" | "BLOCKED" | "SUPERSEDED";
  alerts: readonly string[];
  created_at: string;
  updated_at: string;
  integrity_hash: string;
}>;

export type AffectedOperatorView = Readonly<{ view_id: string; visibility_mode: OperatorScopeType; affected_scope_refs: readonly string[]; operator_role_refs: readonly string[]; affected_missions: readonly string[]; recurrence_count: number; confidence_level: number; supporting_evidence: readonly string[]; operational_impact: string; governance_impact: string; identity_minimized: boolean; sparse_cohort_protected: boolean; restricted_investigation_hidden: boolean; integrity_hash: string }>;
export type OperatorTrendExplorer = Readonly<{ explorer_id: string; trend_points: readonly string[]; contextual_change_markers: readonly string[]; deterministic: boolean; policy_versions_preserved: boolean; recommendation_versions_preserved: boolean; integrity_hash: string }>;
export type OverridePatternView = Readonly<{ view_id: string; override_frequency: number; override_rate: number; override_categories: readonly OverrideCategory[]; override_reasons: readonly string[]; recommendation_quality_context: readonly string[]; evidence_completeness: number; volume_used_as_operator_quality_measure: false; integrity_hash: string }>;
export type ApprovalBehaviorView = Readonly<{ view_id: string; category: ApprovalBehaviorCategory; approval_rate: number; rejection_rate: number; conditional_approval_rate: number; deferment_rate: number; escalation_rate: number; proposal_versions_preserved: boolean; rationale_preserved: boolean; integrity_hash: string }>;
export type ReviewLatencyView = Readonly<{ view_id: string; category: LatencyCategory; time_to_first_review_minutes: number; time_to_final_decision_minutes: number; operator_active_minutes: number; system_delay_minutes: number; evidence_wait_minutes: number; governance_wait_minutes: number; simulation_wait_minutes: number; escalation_wait_minutes: number; upstream_delay_not_attributed_to_operator: boolean; integrity_hash: string }>;
export type OperatorConsistencyView = Readonly<{ view_id: string; state: ConsistencyState; comparison_basis: readonly string[]; excluded_cases: readonly string[]; contextual_differences: readonly string[]; materially_similar_only: boolean; different_context_not_marked_inconsistent: boolean; integrity_hash: string }>;
export type WorkloadDistributionView = Readonly<{ view_id: string; state: WorkloadState; assigned_review_count: number; completed_review_count: number; pending_review_count: number; high_risk_reviews: number; average_complexity: number; queue_concentration: number; complexity_adjusted: boolean; automatic_reassignment_supported: false; integrity_hash: string }>;
export type OperatorComparisonWorkspace = Readonly<{ workspace_id: string; comparison_dimensions: readonly string[]; sample_size: number; uncertainty_disclosed: boolean; comparable_populations: boolean; unsupported_ranking_present: boolean; composite_operator_score_present: boolean; normalization_method: string; source_values_preserved: boolean; integrity_hash: string }>;
export type HistoricalOperatorTrendExplorer = Readonly<{ explorer_id: string; immutable_history_refs: readonly string[]; pattern_persistence: string; policy_versions: readonly string[]; interface_versions: readonly string[]; recommendation_quality_history: readonly string[]; replayable: boolean; integrity_hash: string }>;
export type OperatorImpactReplayExplorer = Readonly<{ explorer_id: string; reconstruction_refs: readonly string[]; canonical_event_ordering: boolean; authority_valid: boolean; evidence_state_verified: boolean; calculation_reproducible: boolean; output_hash_verified: boolean; integrity_hash: string }>;
export type OperatorContextExplanationPanel = Readonly<{ panel_id: string; detection_rationale: string; supporting_cases: readonly string[]; excluded_cases: readonly string[]; sample_size: number; comparison_basis: readonly string[]; alternative_explanations: readonly string[]; limitations: readonly string[]; uncertainty_disclosed: boolean; no_action_option: boolean; misconduct_inferred: false; integrity_hash: string }>;
export type OperatorImpactAlertCenter = Readonly<{ alert_id: string; alerts: readonly string[]; highest_severity: OperatorImpactAlertSeverity; critical_alerts_limited_to_boundary_conditions: boolean; behavioral_alerts_punitive: false; integrity_hash: string }>;
export type OperatorImpactAuditRecord = Readonly<{ audit_id: string; actor: string; tenant_id: string; role: DashboardRole; authority_scope: string; mission_scope: string; operator_scope_accessed: OperatorScopeType; identity_level_requested: boolean; pattern_viewed: string; comparison_performed: string; evidence_accessed: readonly string[]; replay_launched: boolean; filters_applied: readonly string[]; privacy_decision: PrivacyClassification; authorization_result: "ALLOWED" | "DENIED"; append_only: true; tenant_isolated: boolean; replayable: boolean; integrity_result: "PASS" | "FAIL"; timestamp: string; integrity_hash: string }>;
export type OperatorImpactMetrics = Readonly<{ missing_operator_decisions: number; missing_rationales: number; stale_workload_records: number; broken_evidence_references: number; recommendation_version_mismatches: number; replay_failures: number; privacy_control_failures: number; tenant_isolation_failures: number; sparse_cohort_exposures: number; nondeterministic_trend_results: number; integrity_hash_failures: number; integrity_hash: string }>;
export type OperatorImpactValidationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: OperatorImpactDashboardFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type OperatorImpactDashboardApiSurface = Readonly<{ api_id: string; retrieve_dashboard: string; retrieve_contract: string; retrieve_sections: readonly string[]; validate_dashboard: string; inspect_dashboard: string; creation_supported: false; mutation_supported: false; operator_ranking_supported: false; composite_scoring_supported: false; authority_reduction_supported: false; workload_reassignment_supported: false; disciplinary_action_supported: false; production_modification_supported: false; integrity_hash: string }>;
export type OperatorImpactDashboardInput = Readonly<{ scenario?: OperatorImpactDashboardScenario; tenant_id?: string; role?: DashboardRole; identity_level_requested?: boolean; minimum_cohort_size?: number }>;
export type OperatorImpactDashboardResult = Readonly<{ operator_impact_dashboard_version: "operator-impact-dashboard/v10.14.4.8"; dashboard_identifier: "OperatorImpactDashboard"; status: OperatorImpactDashboardStatus; api_surface: OperatorImpactDashboardApiSurface; records: readonly OperatorImpactDashboardRecord[]; affected_operator_view: AffectedOperatorView; trend_explorer: OperatorTrendExplorer; override_pattern_view: OverridePatternView; approval_behavior_view: ApprovalBehaviorView; review_latency_view: ReviewLatencyView; consistency_view: OperatorConsistencyView; workload_distribution_view: WorkloadDistributionView; comparison_workspace: OperatorComparisonWorkspace; historical_trend_explorer: HistoricalOperatorTrendExplorer; replay_explorer: OperatorImpactReplayExplorer; context_panel: OperatorContextExplanationPanel; alert_center: OperatorImpactAlertCenter; audit_records: readonly OperatorImpactAuditRecord[]; widgets: readonly OperatorImpactWidget[]; metrics: OperatorImpactMetrics; validation_tests: readonly OperatorImpactValidationTest[]; validation_outcome: OperatorImpactValidationOutcome; failures: readonly OperatorImpactDashboardFailure[]; deterministic: boolean; replayable: boolean; tenant_isolated: boolean; privacy_enforced: boolean; advisory_only: true; read_only: true; write_authority_granted: false; replay_hash: string; integrity_hash: string }>;
export type OperatorImpactDashboardValidationResult = Readonly<{ dashboard_id: string | null; valid: boolean; validation_outcome: OperatorImpactValidationOutcome; failures: readonly OperatorImpactDashboardFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; read_only: boolean; validation_hash: string }>;
export type OperatorImpactDashboardObservabilitySurface = Readonly<{ dashboard_id: string; status: OperatorImpactDashboardStatus; validation_outcome: OperatorImpactValidationOutcome; records: number; failed_tests: number; failures: readonly OperatorImpactDashboardFailure[]; privacy_enforced: boolean; tenant_isolated: boolean; read_only: boolean; integrity_hash: string }>;
export type OperatorImpactDashboardContract = Readonly<{ doctrine: Readonly<{ version: "operator-impact-dashboard/v10.14.4.8"; widgets: readonly OperatorImpactWidget[]; operator_scopes: readonly OperatorScopeType[]; pattern_categories: readonly OperatorImpactPatternCategory[]; override_categories: readonly OverrideCategory[]; approval_behavior_categories: readonly ApprovalBehaviorCategory[]; latency_categories: readonly LatencyCategory[]; consistency_states: readonly ConsistencyState[]; workload_states: readonly WorkloadState[]; required_data_sources: readonly string[]; advisory_only: true; read_only: true }>; result: OperatorImpactDashboardResult; validation: OperatorImpactDashboardValidationResult; observability: OperatorImpactDashboardObservabilitySurface }>;
