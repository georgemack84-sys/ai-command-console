import type { PolicyAnalysisPolicyType, PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyCorrelationRecord } from "@/types/policy-correlation";
import type { PolicyDependencyGraph } from "@/types/policy-dependency-graph";

export type PolicyImpactCategory = "DIRECT_IMPACT" | "SECONDARY_IMPACT" | "CASCADING_IMPACT" | "LONGITUDINAL_IMPACT" | "CROSS_SYSTEM_IMPACT";
export type PolicyImpactMode = "HISTORICAL" | "PROJECTED" | "COUNTERFACTUAL" | "MIXED";
export type PolicyImpactConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type PolicyImpactState =
  | "CREATED"
  | "SOURCE_VALIDATED"
  | "IMPACT_DISCOVERED"
  | "METRICS_CALCULATED"
  | "EVIDENCE_VERIFIED"
  | "REPLAYABLE"
  | "CERTIFICATION_READY"
  | "RESTRICTED"
  | "INCOMPLETE"
  | "INSUFFICIENT_EVIDENCE"
  | "REPLAY_MISMATCH"
  | "INVALID"
  | "ARCHIVED";

export type PolicyImpactFailureReason =
  | "POLICY_ANALYSIS_MISSING"
  | "POLICY_ANALYSIS_INVALID"
  | "POLICY_CORRELATION_MISSING"
  | "POLICY_CORRELATION_INVALID"
  | "POLICY_GRAPH_MISSING"
  | "POLICY_GRAPH_INVALID"
  | "IMPACT_SCOPE_MISSING"
  | "AFFECTED_OBJECTS_MISSING"
  | "UNSUPPORTED_AFFECTED_OBJECT"
  | "UNSUPPORTED_IMPACT_CATEGORY"
  | "UNSUPPORTED_IMPACT_MODE"
  | "IMPACT_PATH_MISSING"
  | "IMPACT_PATH_UNSUPPORTED"
  | "TIMELINE_MISSING"
  | "TIMELINE_ORDERING_MISMATCH"
  | "METRIC_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "EVIDENCE_MISSING"
  | "LINEAGE_MISSING"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_MISMATCH"
  | "TENANT_MISMATCH"
  | "UNBOUNDED_PROJECTION"
  | "PROJECTED_IMPACT_TREATED_AS_FACT"
  | "AUTHORITY_EXPANSION"
  | "ENFORCEMENT_ATTEMPT"
  | "IMPACT_HASH_MISMATCH"
  | "INVALID_IMPACT_STATE"
  | "INVALID_STATE_TRANSITION"
  | "IDENTIFIER_MUTATION";

export type PolicyImpactScope = Readonly<{
  tenant_scope: string;
  mission_scope: string;
  system_scope: string;
  governance_scope: string;
  runtime_scope: string;
  authority_scope: string;
  historical_window: string;
  projection_scope: "historical_only" | "bounded_scenario_only" | "counterfactual_bounded";
  visibility_scope: string;
}>;

export type AffectedComponent = Readonly<{
  component_id: string;
  component_type: string;
  impact_category: PolicyImpactCategory;
  impact_depth: number;
  supporting_records: readonly string[];
  replay_status: "REPLAYABLE" | "NOT_REPLAYABLE";
}>;

export type AffectedPolicy = Readonly<{
  source_policy_id: string;
  affected_policy_id: string;
  relationship_type: string;
  dependency_path: readonly string[];
  conflict_status: string;
  supersession_status: string;
  evidence_refs: readonly string[];
}>;

export type AffectedDecision = Readonly<{
  decision_id: string;
  decision_type: string;
  decision_state: string;
  policy_effect: string;
  impact_path: readonly string[];
  truth_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type AffectedRecommendation = Readonly<{
  recommendation_id: string;
  recommendation_state: string;
  policy_effect: string;
  constraint_applied: string;
  exception_applied: string | null;
  evidence_refs: readonly string[];
}>;

export type AffectedAuthority = Readonly<{
  authority_id: string;
  authority_type: string;
  authority_action: string;
  authority_scope: string;
  policy_trigger: string;
  evidence_refs: readonly string[];
}>;

export type AffectedRuntimeEvent = Readonly<{
  runtime_event_id: string;
  runtime_control: string;
  runtime_result: string;
  policy_constraint: string;
  governance_result: string;
  evidence_refs: readonly string[];
}>;

export type AffectedMission = Readonly<{
  mission_id: string;
  mission_state_before: string;
  mission_state_after: string;
  policy_impact_category: PolicyImpactCategory;
  impact_path: readonly string[];
  truth_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type AffectedGovernanceAction = Readonly<{
  governance_event_id: string;
  governance_action: string;
  policy_influence: string;
  authority_context: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type AffectedCertification = Readonly<{
  certification_id: string;
  certification_state: string;
  policy_influence: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type AffectedViolation = Readonly<{
  violation_id: string;
  violation_state: string;
  policy_influence: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type PolicyImpactTimelineEvent = Readonly<{
  timestamp: string;
  event_id: string;
  event_type: string;
  policy_version: string;
  impact_category: PolicyImpactCategory;
  affected_object: string;
  governance_context: string;
  truth_ref: string;
  replay_ref: string;
}>;

export type PolicyImpactMetrics = Readonly<{
  impact_path_length: number;
  maximum_depth: number;
  average_depth: number;
  deepest_affected_object: string;
  direct_dependency_count: number;
  indirect_dependency_count: number;
  inheritance_count: number;
  supersession_count: number;
  conflict_count: number;
  shared_authority_count: number;
  governance_decision_count: number;
  authority_event_count: number;
  operator_review_count: number;
  escalation_count: number;
  certification_event_count: number;
  fail_closed_event_count: number;
  policy_application_count: number;
  policy_block_count: number;
  policy_allow_count: number;
  policy_restrict_count: number;
  policy_escalation_count: number;
  policy_exception_count: number;
  violation_detected_count: number;
  violation_prevented_count: number;
  violation_escalated_count: number;
  violation_repeated_count: number;
  violation_resolved_count: number;
  recommendations_generated_under_policy: number;
  recommendations_rejected_by_policy: number;
  recommendations_narrowed_by_policy: number;
  recommendations_escalated_by_policy: number;
  recommendations_marked_advisory_only: number;
  operator_approval_required_count: number;
  authority_denied_count: number;
  authority_granted_count: number;
  authority_escalated_count: number;
  delegated_authority_rejected_count: number;
  shared_authority_conflict_count: number;
  metric_hash: string;
}>;

export type PolicyImpactReplayRefs = Readonly<{
  policy_analysis_snapshot_refs: readonly string[];
  policy_correlation_snapshot_refs: readonly string[];
  policy_dependency_graph_snapshot_refs: readonly string[];
  truth_ledger_snapshot_refs: readonly string[];
  impact_algorithm_version: "policy-impact-analysis/v7B.4";
  impact_path_hash: string;
  metric_hash: string;
  confidence_hash: string;
  impact_output_hash: string;
  replay_execution_ref: string;
}>;

export type PolicyImpactAnalysis = Readonly<{
  schema_version: "policy-impact-analysis/v7B.4";
  policy_impact_id: string;
  tenant_id: string;
  policy_analysis_id: string;
  policy_id: string;
  policy_version: string;
  policy_type: PolicyAnalysisPolicyType;
  impact_scope: PolicyImpactScope;
  impact_category: PolicyImpactCategory;
  impact_mode: PolicyImpactMode;
  affected_components: readonly AffectedComponent[];
  affected_policies: readonly AffectedPolicy[];
  affected_decisions: readonly AffectedDecision[];
  affected_recommendations: readonly AffectedRecommendation[];
  affected_authorities: readonly AffectedAuthority[];
  affected_runtime_events: readonly AffectedRuntimeEvent[];
  affected_missions: readonly AffectedMission[];
  affected_governance_actions: readonly AffectedGovernanceAction[];
  affected_certifications: readonly AffectedCertification[];
  affected_violations: readonly AffectedViolation[];
  impact_path: readonly string[];
  historical_timeline: readonly PolicyImpactTimelineEvent[];
  impact_metrics: PolicyImpactMetrics;
  confidence_score: PolicyImpactConfidence;
  confidence_basis: readonly string[];
  source_policy_correlations: readonly string[];
  source_dependency_graph_refs: readonly string[];
  source_truth_records: readonly string[];
  source_ledger_records: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: PolicyImpactReplayRefs;
  impact_state: PolicyImpactState;
  impact_hash: string;
  created_timestamp: string;
}>;

export type PolicyImpactDoctrine = Readonly<{
  principles: readonly ("evidence-required" | "no-unsupported-causality" | "historical-projected-separated" | "advisory-only" | "replay-required" | "tenant-isolated" | "fail-closed")[];
  prohibited_behaviors: readonly string[];
  supported_categories: readonly PolicyImpactCategory[];
  supported_modes: readonly PolicyImpactMode[];
  allowed_state_transitions: Readonly<Record<PolicyImpactState, readonly PolicyImpactState[]>>;
}>;

export type PolicyImpactValidationFailure = Readonly<{
  failure_id: string;
  reason: PolicyImpactFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type PolicyImpactValidationResult = Readonly<{
  validation_id: string;
  policy_impact_id?: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly PolicyImpactValidationFailure[];
  impact_hash?: string;
  deterministic: true;
  replayable: boolean;
  tenant_scoped: boolean;
  advisory_only: true;
}>;

export type PolicyImpactReplayResult = Readonly<{
  replay_id: string;
  policy_impact_id: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: PolicyImpactFailureReason | null;
  reconstructed_hash: string;
  expected_hash: string;
  final_state: PolicyImpactState;
}>;

export type PolicyImpactExplanation = Readonly<{
  explanation_id: string;
  what_changed: string;
  why_it_changed: string;
  policy_influence: string;
  constraints_applied: readonly string[];
  exceptions_applied: readonly string[];
  authority_involved: readonly string[];
  supporting_evidence: readonly string[];
  replay_references: readonly string[];
  confidence_score: PolicyImpactConfidence;
  confidence_basis: readonly string[];
}>;

export type PolicyImpactEngineResult = Readonly<{
  engine_id: string;
  policy_analysis: PolicyAnalysisRecord;
  policy_correlations: readonly PolicyCorrelationRecord[];
  policy_graph: PolicyDependencyGraph;
  impact: PolicyImpactAnalysis;
  explanation: PolicyImpactExplanation;
  validation: PolicyImpactValidationResult;
}>;

export type PolicyImpactObservabilitySurface = Readonly<{
  policy_analyzed: string;
  policy_version: string;
  policy_type: PolicyAnalysisPolicyType;
  impact_records: readonly PolicyImpactAnalysis[];
  impact_category: PolicyImpactCategory;
  impact_mode: PolicyImpactMode;
  affected_systems: readonly AffectedComponent[];
  affected_decisions: readonly AffectedDecision[];
  affected_recommendations: readonly AffectedRecommendation[];
  affected_missions: readonly AffectedMission[];
  affected_governance_actions: readonly AffectedGovernanceAction[];
  affected_authorities: readonly AffectedAuthority[];
  affected_runtime_events: readonly AffectedRuntimeEvent[];
  impact_path: readonly string[];
  historical_timeline: readonly PolicyImpactTimelineEvent[];
  impact_metrics: PolicyImpactMetrics;
  confidence_score: PolicyImpactConfidence;
  confidence_basis: readonly string[];
  evidence_completeness: "COMPLETE" | "PARTIAL" | "MISSING";
  replay_status: "REPLAYABLE" | "NOT_REPLAYABLE";
  validation_failures: readonly PolicyImpactValidationFailure[];
  restricted_visibility_warnings: readonly string[];
}>;
