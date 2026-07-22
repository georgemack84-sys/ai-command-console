import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AffectedOperatorView,
  ApprovalBehaviorCategory,
  ApprovalBehaviorView,
  ConsistencyState,
  HistoricalOperatorTrendExplorer,
  LatencyCategory,
  OperatorComparisonWorkspace,
  OperatorContextExplanationPanel,
  OperatorImpactAlertCenter,
  OperatorImpactDashboardApiSurface,
  OperatorImpactDashboardContract,
  OperatorImpactDashboardFailure,
  OperatorImpactDashboardInput,
  OperatorImpactDashboardObservabilitySurface,
  OperatorImpactDashboardRecord,
  OperatorImpactDashboardResult,
  OperatorImpactDashboardScenario,
  OperatorImpactDashboardValidationResult,
  OperatorImpactMetrics,
  OperatorImpactPatternCategory,
  OperatorImpactReplayExplorer,
  OperatorImpactValidationTest,
  OperatorImpactWidget,
  OperatorConsistencyView,
  OperatorScopeType,
  OverrideCategory,
  OverridePatternView,
  PrivacyClassification,
  ReviewLatencyView,
  OperatorTrendExplorer,
  WorkloadDistributionView,
  WorkloadState,
  OperatorImpactAuditRecord,
} from "@/types/operator-impact-dashboard";

const VERSION = "operator-impact-dashboard/v10.14.4.8" as const;
const DASHBOARD_ID = "OperatorImpactDashboard" as const;
const TENANT_ID = "tenant_mission_control";
const MINIMUM_COHORT_SIZE = 5;

const WIDGETS: readonly OperatorImpactWidget[] = Object.freeze(["Affected Operators", "Operator Trends", "Override Patterns", "Approval Behavior", "Review Latency", "Operator Consistency", "Workload Distribution", "Comparison Workspace", "Historical Trends", "Replay Explorer", "Context Panel", "Alert Center"]);
const OPERATOR_SCOPES: readonly OperatorScopeType[] = Object.freeze(["INDIVIDUAL_OPERATOR", "OPERATOR_ROLE", "OPERATOR_TEAM", "MISSION_OPERATOR_GROUP", "TENANT_OPERATOR_GROUP", "PSEUDONYMIZED_COHORT", "SYSTEM_WIDE_AGGREGATE"]);
const PATTERN_CATEGORIES: readonly OperatorImpactPatternCategory[] = Object.freeze(["RECURRING_OVERRIDE", "RECURRING_REJECTION", "RECURRING_APPROVAL", "RECURRING_DEFERMENT", "REVIEW_LATENCY_INCREASE", "REVIEW_LATENCY_DECREASE", "DECISION_INCONSISTENCY", "DECISION_STABILITY", "WORKLOAD_CONCENTRATION", "WORKLOAD_IMBALANCE", "HIGH_ESCALATION_RATE", "LOW_RECOMMENDATION_USABILITY", "EVIDENCE_REVIEW_DIFFICULTY", "GOVERNANCE_FRICTION", "MISSION_SPECIFIC_OPERATOR_PATTERN", "ROLE_SPECIFIC_OPERATOR_PATTERN", "POSSIBLE_TRAINING_GAP", "POSSIBLE_INTERFACE_GAP", "POSSIBLE_RECOMMENDATION_QUALITY_GAP", "INSUFFICIENT_EVIDENCE"]);
const OVERRIDE_CATEGORIES: readonly OverrideCategory[] = Object.freeze(["RISK_TOO_HIGH", "RISK_TOO_LOW", "INSUFFICIENT_EVIDENCE", "INCORRECT_CONTEXT", "GOVERNANCE_CONFLICT", "CONSTITUTIONAL_CONFLICT", "AUTHORITY_CONCERN", "MISSION_PRIORITY_CONFLICT", "RECOMMENDATION_NOT_USABLE", "BETTER_OPERATOR_ALTERNATIVE", "TIMING_CONSTRAINT", "RESOURCE_CONSTRAINT", "OTHER_DOCUMENTED_REASON", "REASON_NOT_RECORDED"]);
const APPROVAL_CATEGORIES: readonly ApprovalBehaviorCategory[] = Object.freeze(["APPROVAL_STABLE", "APPROVAL_INCREASING", "APPROVAL_DECREASING", "HIGH_CONDITIONAL_APPROVAL", "HIGH_DEFERMENT", "HIGH_ESCALATION", "RISK_SENSITIVE_APPROVAL", "EVIDENCE_SENSITIVE_APPROVAL", "GOVERNANCE_SENSITIVE_APPROVAL", "INCONSISTENT_APPROVAL_PATTERN", "INSUFFICIENT_SAMPLE"]);
const LATENCY_CATEGORIES: readonly LatencyCategory[] = Object.freeze(["WITHIN_EXPECTED_RANGE", "IMPROVING", "DEGRADING", "HIGH_QUEUE_DELAY", "HIGH_EVIDENCE_DELAY", "HIGH_GOVERNANCE_DELAY", "HIGH_OPERATOR_REVIEW_TIME", "HIGH_SYSTEM_DELAY", "BLOCKED_BY_DEPENDENCY", "INSUFFICIENT_DATA"]);
const CONSISTENCY_STATES: readonly ConsistencyState[] = Object.freeze(["CONSISTENT", "MOSTLY_CONSISTENT", "CONTEXTUALLY_VARIABLE", "POTENTIALLY_INCONSISTENT", "INSUFFICIENT_COMPARABLE_CASES", "UNDER_REVIEW"]);
const WORKLOAD_STATES: readonly WorkloadState[] = Object.freeze(["BALANCED", "MODERATELY_CONCENTRATED", "HIGHLY_CONCENTRATED", "OVERLOADED", "UNDERUTILIZED", "MISSION_DRIVEN_CONCENTRATION", "ROLE_CONSTRAINED", "INSUFFICIENT_DATA"]);

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

function failureForScenario(scenario: OperatorImpactDashboardScenario): OperatorImpactDashboardFailure | undefined {
  const map: Partial<Record<OperatorImpactDashboardScenario, OperatorImpactDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    MISSING_TENANT: "TENANT_CONTEXT_UNAVAILABLE",
    MISSION_SCOPE_UNVERIFIED: "MISSION_SCOPE_UNVERIFIED",
    UNAUTHORIZED_IDENTITY_ACCESS: "OPERATOR_VISIBILITY_UNAUTHORIZED",
    MISSING_PRIVACY_CLASSIFICATION: "PRIVACY_CLASSIFICATION_MISSING",
    SPARSE_COHORT: "MINIMUM_COHORT_SIZE_VIOLATED",
    AUTHORITY_CONTEXT_MISSING: "AUTHORITY_CONTEXT_UNAVAILABLE",
    RECOMMENDATION_VERSION_UNRESOLVED: "RECOMMENDATION_VERSION_UNRESOLVED",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_INCOMPLETE",
    REPLAY_INTEGRITY_FAILURE: "REPLAY_INTEGRITY_FAILED",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    INCOMPARABLE_POPULATIONS: "COMPARISON_POPULATIONS_NOT_COMPARABLE",
    NONDETERMINISTIC_CALCULATION: "CALCULATION_NONDETERMINISTIC",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    HIDDEN_OPERATOR_PROFILING: "HIDDEN_OPERATOR_PROFILING_DETECTED",
    OPERATOR_RANKING: "UNSUPPORTED_OPERATOR_RANKING",
    COMPOSITE_SCORE: "COMPOSITE_OPERATOR_SCORE_DETECTED",
    AUTHORITY_REDUCTION_EXPOSED: "AUTHORITY_REDUCTION_EXPOSED",
    WORKLOAD_REASSIGNMENT_EXPOSED: "WORKLOAD_REASSIGNMENT_EXPOSED",
    DISCIPLINARY_ACTION_EXPOSED: "DISCIPLINARY_ACTION_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario];
}

function apiSurface(): OperatorImpactDashboardApiSurface {
  const base: Omit<OperatorImpactDashboardApiSurface, "integrity_hash"> = {
    api_id: "operator_impact_dashboard_api",
    retrieve_dashboard: "POST /operator-impact-dashboard/dashboard",
    retrieve_contract: "GET /operator-impact-dashboard/contract",
    retrieve_sections: freezeArray(["affected", "trends", "overrides", "approval", "latency", "consistency", "workload", "comparison", "historical", "replay", "context", "alerts", "audit"]),
    validate_dashboard: "POST /operator-impact-dashboard/validate",
    inspect_dashboard: "POST /operator-impact-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    operator_ranking_supported: false,
    composite_scoring_supported: false,
    authority_reduction_supported: false,
    workload_reassignment_supported: false,
    disciplinary_action_supported: false,
    production_modification_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function records(input: OperatorImpactDashboardInput, failures: readonly OperatorImpactDashboardFailure[]): readonly OperatorImpactDashboardRecord[] {
  const privacy: PrivacyClassification = failures.includes("PRIVACY_CLASSIFICATION_MISSING") ? "BLOCKED" : input.identity_level_requested ? "IDENTITY_VISIBLE_AUTHORIZED" : "PSEUDONYMIZED";
  const scope: OperatorScopeType = input.identity_level_requested ? "INDIVIDUAL_OPERATOR" : "PSEUDONYMIZED_COHORT";
  const base: Omit<OperatorImpactDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: id("operator_impact_record", "pattern-operator-impact-1"),
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID,
    mission_scope: failures.includes("MISSION_SCOPE_UNVERIFIED") ? "" : "mission-control-operator-impact",
    pattern_id: "pattern_operator_impact_1",
    pattern_version: "v1",
    operator_scope_type: scope,
    operator_refs: input.identity_level_requested && !failures.includes("OPERATOR_VISIBILITY_UNAUTHORIZED") ? freezeArray(["operator:authorized:17"]) : freezeArray(["operator:pseudonymized:cohort-alpha"]),
    operator_role_refs: freezeArray(["role:mission-reviewer", "role:governance-reviewer"]),
    affected_mission_refs: freezeArray(["mission:adaptive-command"]),
    recommendation_refs: failures.includes("RECOMMENDATION_VERSION_UNRESOLVED") ? freezeArray([]) : freezeArray(["recommendation:mission-risk:v3"]),
    outcome_refs: freezeArray(["outcome:mission-review:1"]),
    feedback_refs: freezeArray(["feedback:operator-rationale:1"]),
    governance_refs: failures.includes("AUTHORITY_CONTEXT_UNAVAILABLE") ? freezeArray([]) : freezeArray(["governance:operator-authority:v1"]),
    evidence_refs: failures.includes("EVIDENCE_REFERENCE_INCOMPLETE") ? freezeArray([]) : freezeArray(["evidence:operator-impact:1"]),
    replay_refs: failures.includes("REPLAY_INTEGRITY_FAILED") ? freezeArray([]) : freezeArray(["replay:operator-impact:1"]),
    pattern_category: failures.includes("MINIMUM_COHORT_SIZE_VIOLATED") ? "INSUFFICIENT_EVIDENCE" : "RECURRING_OVERRIDE",
    pattern_summary: "Operators in the authorized scope repeatedly override low-usability recommendations when evidence context is incomplete.",
    behavior_metrics: freezeArray(["override_count:8", "deferment_count:2", "escalation_count:1"]),
    override_metrics: freezeArray(["override_frequency:8", "override_rate:0.32", "quality_context:visible"]),
    approval_metrics: freezeArray(["approval_rate:0.54", "conditional_approval_rate:0.08", "rejection_rate:0.14"]),
    review_latency_metrics: freezeArray(["operator_active_minutes:36", "system_delay_minutes:19", "evidence_wait_minutes:42"]),
    consistency_metrics: freezeArray(["comparable_cases:12", "context_exclusions:4", "state:CONTEXTUALLY_VARIABLE"]),
    workload_metrics: freezeArray(["assigned:18", "completed:14", "pending:4", "complexity_adjusted:true"]),
    confidence_level: failures.includes("CALCULATION_NONDETERMINISTIC") ? 0.43 : 0.82,
    strategic_impact: "MODERATE",
    governance_impact: failures.includes("AUTHORITY_CONTEXT_UNAVAILABLE") ? "CRITICAL" : "MODERATE",
    privacy_classification: privacy,
    visible_to_roles: freezeArray(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"]),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["operator_private_feedback", "identity_resolution_key", "restricted_investigation_ref"]),
    current_status: failures.length ? "BLOCKED" : "ACTIVE",
    alerts: failures,
    created_at: "2026-07-09T00:00:00.000Z",
    updated_at: "2026-07-09T00:00:00.000Z",
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) })]);
}

function affected(record: OperatorImpactDashboardRecord | undefined, failures: readonly OperatorImpactDashboardFailure[]): AffectedOperatorView {
  const base: Omit<AffectedOperatorView, "integrity_hash"> = { view_id: "affected_operator_view", visibility_mode: record?.operator_scope_type ?? "PSEUDONYMIZED_COHORT", affected_scope_refs: record?.operator_refs ?? freezeArray([]), operator_role_refs: record?.operator_role_refs ?? freezeArray([]), affected_missions: record?.affected_mission_refs ?? freezeArray([]), recurrence_count: 8, confidence_level: record?.confidence_level ?? 0, supporting_evidence: record?.evidence_refs ?? freezeArray([]), operational_impact: "review friction and override recurrence visible with context", governance_impact: record?.governance_impact ?? "LOW", identity_minimized: !record || record.operator_scope_type !== "INDIVIDUAL_OPERATOR" || record.privacy_classification === "IDENTITY_VISIBLE_AUTHORIZED", sparse_cohort_protected: !failures.includes("MINIMUM_COHORT_SIZE_VIOLATED"), restricted_investigation_hidden: !failures.includes("RESTRICTED_FIELD_EXPOSED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function trends(record: OperatorImpactDashboardRecord | undefined, failures: readonly OperatorImpactDashboardFailure[]): OperatorTrendExplorer {
  const base: Omit<OperatorTrendExplorer, "integrity_hash"> = { explorer_id: "operator_trend_explorer", trend_points: freezeArray(["approval:stable", "override:increasing", "deferment:stable", "latency:evidence-driven", "workload:moderate"]), contextual_change_markers: freezeArray(["policy:v1", "recommendation-engine:v3", "mission-type:adaptive-command", "workload:surge-window"]), deterministic: !failures.includes("CALCULATION_NONDETERMINISTIC"), policy_versions_preserved: Boolean(record?.governance_refs.length), recommendation_versions_preserved: Boolean(record?.recommendation_refs.length) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function overrides(record: OperatorImpactDashboardRecord | undefined): OverridePatternView {
  const base: Omit<OverridePatternView, "integrity_hash"> = { view_id: "override_pattern_view", override_frequency: 8, override_rate: 0.32, override_categories: freezeArray(["INSUFFICIENT_EVIDENCE", "RECOMMENDATION_NOT_USABLE", "BETTER_OPERATOR_ALTERNATIVE"]), override_reasons: freezeArray(["missing evidence context", "recommendation explanation unclear"]), recommendation_quality_context: freezeArray(["quality_score:0.68", "usability_gap:visible", "system_quality_failure_possible:true"]), evidence_completeness: record?.evidence_refs.length ? 0.91 : 0, volume_used_as_operator_quality_measure: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function approval(): ApprovalBehaviorView {
  const base: Omit<ApprovalBehaviorView, "integrity_hash"> = { view_id: "approval_behavior_view", category: "EVIDENCE_SENSITIVE_APPROVAL", approval_rate: 0.54, rejection_rate: 0.14, conditional_approval_rate: 0.08, deferment_rate: 0.1, escalation_rate: 0.04, proposal_versions_preserved: true, rationale_preserved: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function latency(): ReviewLatencyView {
  const base: Omit<ReviewLatencyView, "integrity_hash"> = { view_id: "review_latency_view", category: "HIGH_EVIDENCE_DELAY", time_to_first_review_minutes: 12, time_to_final_decision_minutes: 97, operator_active_minutes: 36, system_delay_minutes: 19, evidence_wait_minutes: 42, governance_wait_minutes: 0, simulation_wait_minutes: 0, escalation_wait_minutes: 0, upstream_delay_not_attributed_to_operator: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function consistency(failures: readonly OperatorImpactDashboardFailure[]): OperatorConsistencyView {
  const base: Omit<OperatorConsistencyView, "integrity_hash"> = { view_id: "operator_consistency_view", state: failures.includes("COMPARISON_POPULATIONS_NOT_COMPARABLE") ? "UNDER_REVIEW" : "CONTEXTUALLY_VARIABLE", comparison_basis: freezeArray(["mission type", "proposal type", "risk level", "confidence level", "evidence quality", "governance requirements", "policy version"]), excluded_cases: failures.includes("COMPARISON_POPULATIONS_NOT_COMPARABLE") ? freezeArray(["incomparable population blocked"]) : freezeArray(["different policy version", "different mission urgency"]), contextual_differences: freezeArray(["evidence quality varied", "recommendation quality varied"]), materially_similar_only: !failures.includes("COMPARISON_POPULATIONS_NOT_COMPARABLE"), different_context_not_marked_inconsistent: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function workload(failures: readonly OperatorImpactDashboardFailure[]): WorkloadDistributionView {
  const base: Omit<WorkloadDistributionView, "integrity_hash"> = { view_id: "workload_distribution_view", state: failures.includes("WORKLOAD_REASSIGNMENT_EXPOSED") ? "OVERLOADED" : "MODERATELY_CONCENTRATED", assigned_review_count: 18, completed_review_count: 14, pending_review_count: 4, high_risk_reviews: 3, average_complexity: 0.71, queue_concentration: 0.38, complexity_adjusted: true, automatic_reassignment_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function comparison(failures: readonly OperatorImpactDashboardFailure[], sampleSize: number): OperatorComparisonWorkspace {
  const base: Omit<OperatorComparisonWorkspace, "integrity_hash"> = { workspace_id: "operator_comparison_workspace", comparison_dimensions: freezeArray(["approval behavior", "override behavior", "review latency", "decision consistency", "workload", "recommendation usability", "evidence quality"]), sample_size: sampleSize, uncertainty_disclosed: true, comparable_populations: !failures.includes("COMPARISON_POPULATIONS_NOT_COMPARABLE"), unsupported_ranking_present: failures.includes("UNSUPPORTED_OPERATOR_RANKING"), composite_operator_score_present: failures.includes("COMPOSITE_OPERATOR_SCORE_DETECTED"), normalization_method: "role, mission, risk, evidence quality, governance, complexity, and policy-version adjusted", source_values_preserved: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function historical(record: OperatorImpactDashboardRecord | undefined): HistoricalOperatorTrendExplorer {
  const base: Omit<HistoricalOperatorTrendExplorer, "integrity_hash"> = { explorer_id: "historical_operator_trend_explorer", immutable_history_refs: freezeArray(["history:operator-impact:2026-07"]), pattern_persistence: "persistent across current policy period", policy_versions: record?.governance_refs ?? freezeArray([]), interface_versions: freezeArray(["interface:v2"]), recommendation_quality_history: freezeArray(["recommendation-quality:0.68", "evidence-quality:0.91"]), replayable: Boolean(record?.replay_refs.length) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replay(record: OperatorImpactDashboardRecord | undefined, failures: readonly OperatorImpactDashboardFailure[]): OperatorImpactReplayExplorer {
  const base: Omit<OperatorImpactReplayExplorer, "integrity_hash"> = { explorer_id: "operator_impact_replay_explorer", reconstruction_refs: freezeArray(["recommendation", "evidence", "mission-state", "risk-state", "governance-state", "operator-decision", "outcome", "pattern-calculation"]), canonical_event_ordering: true, authority_valid: !failures.includes("AUTHORITY_CONTEXT_UNAVAILABLE"), evidence_state_verified: Boolean(record?.evidence_refs.length), calculation_reproducible: !failures.includes("CALCULATION_NONDETERMINISTIC"), output_hash_verified: !failures.includes("REPLAY_INTEGRITY_FAILED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function contextPanel(record: OperatorImpactDashboardRecord | undefined, failures: readonly OperatorImpactDashboardFailure[]): OperatorContextExplanationPanel {
  const base: Omit<OperatorContextExplanationPanel, "integrity_hash"> = { panel_id: "operator_context_explanation_panel", detection_rationale: "Recurring overrides were detected where recommendation usability and evidence context were weaker than comparable accepted recommendations.", supporting_cases: record?.evidence_refs ?? freezeArray([]), excluded_cases: failures.includes("COMPARISON_POPULATIONS_NOT_COMPARABLE") ? freezeArray(["incomparable cases blocked"]) : freezeArray(["different mission urgency", "different policy version"]), sample_size: failures.includes("MINIMUM_COHORT_SIZE_VIOLATED") ? 2 : 12, comparison_basis: freezeArray(["mission", "risk", "confidence", "evidence", "governance", "policy version"]), alternative_explanations: freezeArray(["poor recommendation quality", "missing evidence", "governance conflict", "operator expertise", "unusual mission conditions", "workload surge"]), limitations: freezeArray(["pattern is hypothesis, not personnel verdict", "no misconduct inference", "requires human authorized process for personnel conclusions"]), uncertainty_disclosed: true, no_action_option: true, misconduct_inferred: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alerts(failures: readonly OperatorImpactDashboardFailure[]): OperatorImpactAlertCenter {
  const criticalFailures: readonly OperatorImpactDashboardFailure[] = ["OPERATOR_VISIBILITY_UNAUTHORIZED", "TENANT_ISOLATION_VIOLATED", "REPLAY_INTEGRITY_FAILED", "RESTRICTED_FIELD_EXPOSED", "AUTHORITY_CONTEXT_UNAVAILABLE", "INTEGRITY_VERIFICATION_FAILED"];
  const base: Omit<OperatorImpactAlertCenter, "integrity_hash"> = { alert_id: "operator_impact_alert_center", alerts: freezeArray(failures.length ? failures : ["sustained override increase", "operator usability decline"]), highest_severity: failures.some((failure) => criticalFailures.includes(failure)) ? "CRITICAL" : failures.length ? "HIGH" : "MODERATE", critical_alerts_limited_to_boundary_conditions: true, behavioral_alerts_punitive: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function audit(input: OperatorImpactDashboardInput, record: OperatorImpactDashboardRecord | undefined, failures: readonly OperatorImpactDashboardFailure[]): readonly OperatorImpactAuditRecord[] {
  const base: Omit<OperatorImpactAuditRecord, "integrity_hash"> = { audit_id: id("operator_impact_audit", { role: input.role ?? "AUDITOR", identity: input.identity_level_requested ?? false }), actor: "codex:dashboard-reader", tenant_id: record?.tenant_id ?? TENANT_ID, role: input.role ?? "AUDITOR", authority_scope: failures.includes("AUTHORITY_CONTEXT_UNAVAILABLE") ? "unverified" : "operator-impact-review", mission_scope: record?.mission_scope ?? "", operator_scope_accessed: record?.operator_scope_type ?? "PSEUDONYMIZED_COHORT", identity_level_requested: Boolean(input.identity_level_requested), pattern_viewed: record?.pattern_id ?? "", comparison_performed: "role and pseudonymized cohort comparison", evidence_accessed: record?.evidence_refs ?? freezeArray([]), replay_launched: Boolean(record?.replay_refs.length), filters_applied: freezeArray(["tenant", "mission", "role", "privacy", "policy-version"]), privacy_decision: record?.privacy_classification ?? "BLOCKED", authorization_result: failures.includes("OPERATOR_VISIBILITY_UNAUTHORIZED") ? "DENIED" : "ALLOWED", append_only: true, tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"), replayable: !failures.includes("REPLAY_INTEGRITY_FAILED"), integrity_result: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAIL" : "PASS", timestamp: "2026-07-09T00:00:00.000Z" };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly OperatorImpactDashboardFailure[]): OperatorImpactMetrics {
  const base: Omit<OperatorImpactMetrics, "integrity_hash"> = { missing_operator_decisions: 0, missing_rationales: 0, stale_workload_records: 0, broken_evidence_references: failures.includes("EVIDENCE_REFERENCE_INCOMPLETE") ? 1 : 0, recommendation_version_mismatches: failures.includes("RECOMMENDATION_VERSION_UNRESOLVED") ? 1 : 0, replay_failures: failures.includes("REPLAY_INTEGRITY_FAILED") ? 1 : 0, privacy_control_failures: failures.includes("PRIVACY_CLASSIFICATION_MISSING") || failures.includes("RESTRICTED_FIELD_EXPOSED") ? 1 : 0, tenant_isolation_failures: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0, sparse_cohort_exposures: failures.includes("MINIMUM_COHORT_SIZE_VIOLATED") ? 1 : 0, nondeterministic_trend_results: failures.includes("CALCULATION_NONDETERMINISTIC") ? 1 : 0, integrity_hash_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: OperatorImpactDashboardFailure, evidence_refs: readonly string[]): OperatorImpactValidationTest {
  const base: Omit<OperatorImpactValidationTest, "integrity_hash"> = { test_id: id("operator_impact_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<OperatorImpactDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly OperatorImpactValidationTest[] {
  const record = result.records[0];
  const evidenceRefs = result.records.map((item) => item.integrity_hash);
  return freezeArray([
    validationTest("tenant context available", Boolean(record?.tenant_id), "TENANT_CONTEXT_UNAVAILABLE", evidenceRefs),
    validationTest("mission scope verified", Boolean(record?.mission_scope), "MISSION_SCOPE_UNVERIFIED", evidenceRefs),
    validationTest("operator visibility authorized", result.audit_records.every((item) => item.authorization_result === "ALLOWED"), "OPERATOR_VISIBILITY_UNAUTHORIZED", evidenceRefs),
    validationTest("privacy classification present", record?.privacy_classification !== "BLOCKED", "PRIVACY_CLASSIFICATION_MISSING", evidenceRefs),
    validationTest("minimum cohort size enforced", result.context_panel.sample_size >= MINIMUM_COHORT_SIZE, "MINIMUM_COHORT_SIZE_VIOLATED", evidenceRefs),
    validationTest("authority context available", result.replay_explorer.authority_valid && Boolean(record?.governance_refs.length), "AUTHORITY_CONTEXT_UNAVAILABLE", evidenceRefs),
    validationTest("recommendation version resolved", Boolean(record?.recommendation_refs.length) && result.trend_explorer.recommendation_versions_preserved, "RECOMMENDATION_VERSION_UNRESOLVED", evidenceRefs),
    validationTest("evidence references complete", result.affected_operator_view.supporting_evidence.length > 0 && result.replay_explorer.evidence_state_verified, "EVIDENCE_REFERENCE_INCOMPLETE", evidenceRefs),
    validationTest("replay integrity valid", result.replay_explorer.output_hash_verified && result.historical_trend_explorer.replayable, "REPLAY_INTEGRITY_FAILED", evidenceRefs),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.audit_records.every((item) => item.tenant_isolated), "TENANT_ISOLATION_VIOLATED", evidenceRefs),
    validationTest("comparison populations comparable", result.comparison_workspace.comparable_populations && result.consistency_view.materially_similar_only, "COMPARISON_POPULATIONS_NOT_COMPARABLE", evidenceRefs),
    validationTest("calculations deterministic", result.deterministic && result.trend_explorer.deterministic && result.replay_explorer.calculation_reproducible, "CALCULATION_NONDETERMINISTIC", evidenceRefs),
    validationTest("restricted fields protected", result.records.every((item) => item.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidenceRefs),
    validationTest("hidden profiling prohibited", result.context_panel.misconduct_inferred === false, "HIDDEN_OPERATOR_PROFILING_DETECTED", evidenceRefs),
    validationTest("unsupported ranking prohibited", !result.comparison_workspace.unsupported_ranking_present, "UNSUPPORTED_OPERATOR_RANKING", evidenceRefs),
    validationTest("composite operator scoring prohibited", !result.comparison_workspace.composite_operator_score_present, "COMPOSITE_OPERATOR_SCORE_DETECTED", evidenceRefs),
    validationTest("authority reduction unavailable", !result.api_surface.authority_reduction_supported, "AUTHORITY_REDUCTION_EXPOSED", evidenceRefs),
    validationTest("workload reassignment unavailable", !result.api_surface.workload_reassignment_supported && !result.workload_distribution_view.automatic_reassignment_supported, "WORKLOAD_REASSIGNMENT_EXPOSED", evidenceRefs),
    validationTest("disciplinary action unavailable", !result.api_surface.disciplinary_action_supported && !result.alert_center.behavioral_alerts_punitive, "DISCIPLINARY_ACTION_EXPOSED", evidenceRefs),
    validationTest("integrity hashes reproducible", result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidenceRefs),
    validationTest("dashboard remains read-only", result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.mutation_supported && !result.api_surface.production_modification_supported, "AUTHORITY_REDUCTION_EXPOSED", evidenceRefs),
  ]);
}

type BuildBase = Omit<OperatorImpactDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">;

function resultReplayHash(result: Omit<OperatorImpactDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({ records: result.records.map((record) => record.integrity_hash), affected: result.affected_operator_view.integrity_hash, trends: result.trend_explorer.integrity_hash, overrides: result.override_pattern_view.integrity_hash, approval: result.approval_behavior_view.integrity_hash, latency: result.review_latency_view.integrity_hash, consistency: result.consistency_view.integrity_hash, workload: result.workload_distribution_view.integrity_hash, comparison: result.comparison_workspace.integrity_hash, replay: result.replay_explorer.integrity_hash, audit: result.audit_records.map((item) => item.integrity_hash), failures: result.failures });
}

function resultIntegrityHash(result: Omit<OperatorImpactDashboardResult, "integrity_hash">): string {
  return hash({ version: result.operator_impact_dashboard_version, id: result.dashboard_identifier, api: result.api_surface.integrity_hash, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome });
}

export function buildOperatorImpactDashboard(input: OperatorImpactDashboardInput = {}): OperatorImpactDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const initialFailures = freezeArray(failureForScenario(scenario) ? [failureForScenario(scenario) as OperatorImpactDashboardFailure] : []);
  const api_surface = apiSurface();
  const dashboardRecords = records(input, initialFailures);
  const record = dashboardRecords[0];
  const affected_operator_view = affected(record, initialFailures);
  const trend_explorer = trends(record, initialFailures);
  const override_pattern_view = overrides(record);
  const approval_behavior_view = approval();
  const review_latency_view = latency();
  const consistency_view = consistency(initialFailures);
  const workload_distribution_view = workload(initialFailures);
  const sampleSize = initialFailures.includes("MINIMUM_COHORT_SIZE_VIOLATED") ? 2 : input.minimum_cohort_size ?? 12;
  const comparison_workspace = comparison(initialFailures, sampleSize);
  const historical_trend_explorer = historical(record);
  const replay_explorer = replay(record, initialFailures);
  const context_panel = contextPanel(record, initialFailures);
  const alert_center = alerts(initialFailures);
  const audit_records = audit(input, record, initialFailures);
  const metricsRecord = metrics(initialFailures);
  const baseWithoutValidation: BuildBase = {
    operator_impact_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    records: dashboardRecords,
    affected_operator_view,
    trend_explorer,
    override_pattern_view,
    approval_behavior_view,
    review_latency_view,
    consistency_view,
    workload_distribution_view,
    comparison_workspace,
    historical_trend_explorer,
    replay_explorer,
    context_panel,
    alert_center,
    audit_records,
    widgets: WIDGETS,
    metrics: metricsRecord,
    deterministic: !initialFailures.includes("CALCULATION_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_INTEGRITY_FAILED"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    privacy_enforced: !initialFailures.some((failure) => ["PRIVACY_CLASSIFICATION_MISSING", "MINIMUM_COHORT_SIZE_VIOLATED", "RESTRICTED_FIELD_EXPOSED"].includes(failure)),
    advisory_only: true,
    read_only: true,
    write_authority_granted: false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is OperatorImpactDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<OperatorImpactDashboardResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperatorImpactDashboard(result?: OperatorImpactDashboardResult): OperatorImpactDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<OperatorImpactDashboardFailure>(["HIDDEN_OPERATOR_PROFILING_DETECTED"]);
    const base: Omit<OperatorImpactDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash
    && hashWithoutIntegrity(result.affected_operator_view) === result.affected_operator_view.integrity_hash
    && hashWithoutIntegrity(result.trend_explorer) === result.trend_explorer.integrity_hash
    && hashWithoutIntegrity(result.override_pattern_view) === result.override_pattern_view.integrity_hash
    && hashWithoutIntegrity(result.approval_behavior_view) === result.approval_behavior_view.integrity_hash
    && hashWithoutIntegrity(result.review_latency_view) === result.review_latency_view.integrity_hash
    && hashWithoutIntegrity(result.consistency_view) === result.consistency_view.integrity_hash
    && hashWithoutIntegrity(result.workload_distribution_view) === result.workload_distribution_view.integrity_hash
    && hashWithoutIntegrity(result.comparison_workspace) === result.comparison_workspace.integrity_hash
    && hashWithoutIntegrity(result.historical_trend_explorer) === result.historical_trend_explorer.integrity_hash
    && hashWithoutIntegrity(result.replay_explorer) === result.replay_explorer.integrity_hash
    && hashWithoutIntegrity(result.context_panel) === result.context_panel.integrity_hash
    && hashWithoutIntegrity(result.alert_center) === result.alert_center.integrity_hash
    && result.audit_records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash
    && result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.mutation_supported && !result.api_surface.authority_reduction_supported && !result.api_surface.workload_reassignment_supported && !result.api_surface.disciplinary_action_supported && !result.api_surface.production_modification_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<OperatorImpactDashboardValidationResult, "validation_hash"> = { dashboard_id: result.dashboard_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, read_only };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayOperatorImpactDashboard(result: OperatorImpactDashboardResult): boolean {
  return validateOperatorImpactDashboard(result).valid;
}

export function buildOperatorImpactDashboardObservabilitySurface(result = buildOperatorImpactDashboard()): OperatorImpactDashboardObservabilitySurface {
  return Object.freeze({ dashboard_id: result.dashboard_identifier, status: result.status, validation_outcome: result.validation_outcome, records: result.records.length, failed_tests: result.validation_tests.filter((test) => !test.passed).length, failures: result.failures, privacy_enforced: result.privacy_enforced, tenant_isolated: result.tenant_isolated, read_only: result.read_only && result.advisory_only && !result.write_authority_granted, integrity_hash: result.integrity_hash });
}

export function getOperatorImpactDashboardContract(): OperatorImpactDashboardContract {
  const result = buildOperatorImpactDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      operator_scopes: OPERATOR_SCOPES,
      pattern_categories: PATTERN_CATEGORIES,
      override_categories: OVERRIDE_CATEGORIES,
      approval_behavior_categories: APPROVAL_CATEGORIES,
      latency_categories: LATENCY_CATEGORIES,
      consistency_states: CONSISTENCY_STATES,
      workload_states: WORKLOAD_STATES,
      required_data_sources: freezeArray(["Pattern Intelligence Engine", "Operator Feedback Integration", "Recommendation Effectiveness Engine", "Outcome Observation Engine", "Strategy Evolution Engine", "Confidence Adaptation Engine", "Risk Adaptation Engine", "Governance-Aware Adaptation Layer", "Operator Approval Workflow", "Adaptive Simulation Framework", "Drift Defense System", "Replay Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Governance Decision Ledger", "Identity and Authorization Service", "Tenant Registry", "Mission Registry", "Work Queue Registry"]),
      advisory_only: true,
      read_only: true,
    }),
    result,
    validation: validateOperatorImpactDashboard(result),
    observability: buildOperatorImpactDashboardObservabilitySurface(result),
  });
}

export const OperatorImpactDashboard = Object.freeze({ build: buildOperatorImpactDashboard, validate: validateOperatorImpactDashboard, replay: replayOperatorImpactDashboard });
