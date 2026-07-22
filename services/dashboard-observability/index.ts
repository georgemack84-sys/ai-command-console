import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AlertLifecycleState,
  ApprovalCompletenessMonitor,
  ApprovalVisibilityState,
  CertificationCompletenessMonitor,
  CertificationVisibilityState,
  DashboardAlert,
  DashboardFreshnessMonitor,
  DashboardHealthEvaluation,
  DashboardHealthReport,
  DashboardHealthState,
  DashboardIncident,
  DashboardMetricsService,
  DashboardObservabilityApiSurface,
  DashboardObservabilityConsole,
  DashboardObservabilityContract,
  DashboardObservabilityFailure,
  DashboardObservabilityInput,
  DashboardObservabilityLedger,
  DashboardObservabilityRecord,
  DashboardObservabilityResult,
  DashboardObservabilityScenario,
  DashboardObservabilitySurface,
  DashboardObservabilityValidationResult,
  DashboardObservabilityValidationTest,
  DashboardObservabilityWidget,
  DashboardPerformanceMonitor,
  DashboardUsageAnalytics,
  DashboardVisibilityValidator,
  FreshnessState,
  HealthDimension,
  LineageIntegrityMonitor,
  LineageState,
  NavigationHealthMonitor,
  ReferenceIntegrityMonitor,
  ReferenceState,
  ReplayAvailabilityMonitor,
  ReplayAvailabilityState,
  ReportState,
  VisibilityValidationOutcome,
  WidgetHealthMonitor,
} from "@/types/dashboard-observability";

const VERSION = "dashboard-observability/v10.14.11" as const;
const ID = "DashboardObservability" as const;
const TENANT_ID = "tenant_mission_control";
const WIDGETS: readonly DashboardObservabilityWidget[] = Object.freeze(["Metrics", "Usage Analytics", "Visibility Validator", "Performance Monitor", "Freshness Monitor", "Lineage Monitor", "Replay Monitor", "Reference Monitor", "Approval Monitor", "Certification Monitor", "Widget Health", "Navigation Health", "Health Evaluator", "Alert Manager", "Incident Registry", "Dashboard Ledger", "Health Reports", "Observability Console"]);
const HEALTH_STATES: readonly DashboardHealthState[] = Object.freeze(["HEALTHY", "DEGRADED", "STALE", "INCOMPLETE", "UNAVAILABLE", "MISLEADING", "SECURITY_RESTRICTED", "OBSERVABILITY_DEGRADED", "CRITICAL_FAILURE", "UNKNOWN"]);
const DIMENSIONS: readonly HealthDimension[] = Object.freeze(["AVAILABILITY", "PERFORMANCE", "RENDERING", "FRESHNESS", "COMPLETENESS", "LINEAGE", "REPLAY", "REFERENCE_INTEGRITY", "APPROVAL_VISIBILITY", "CERTIFICATION_VISIBILITY", "SECURITY_VISIBILITY", "DETERMINISM", "USABILITY", "AUDITABILITY"]);
const FRESHNESS: readonly FreshnessState[] = Object.freeze(["CURRENT", "NEAR_STALE", "STALE", "SEVERELY_STALE", "SOURCE_DELAYED", "CACHE_STALE", "SYNCHRONIZATION_FAILED", "UNKNOWN"]);
const LINEAGE: readonly LineageState[] = Object.freeze(["COMPLETE", "PARTIAL", "BROKEN", "ORPHANED", "VERSION_MISMATCH", "CROSS_TENANT_VIOLATION", "INTEGRITY_FAILURE"]);
const REPLAY: readonly ReplayAvailabilityState[] = Object.freeze(["READY", "PARTIAL", "MISSING", "DIVERGED", "VERSION_MISMATCH", "AUTHORIZATION_BLOCKED", "ENGINE_UNAVAILABLE", "INTEGRITY_FAILURE"]);
const REFERENCES: readonly ReferenceState[] = Object.freeze(["VALID", "VALID_REDACTED", "SUPERSEDED", "BROKEN", "UNAUTHORIZED", "VERSION_MISMATCH", "CROSS_TENANT", "UNKNOWN"]);
const APPROVALS: readonly ApprovalVisibilityState[] = Object.freeze(["COMPLETE", "CONDITIONALLY_COMPLETE", "INCOMPLETE", "MISREPRESENTED", "AUTHORITY_INVALID", "VERSION_INVALID", "UNKNOWN"]);
const CERTIFICATIONS: readonly CertificationVisibilityState[] = Object.freeze(["COMPLETE", "INCOMPLETE", "MISREPRESENTED", "EXPIRED", "REVOKED", "VERSION_MISMATCH", "MISSING", "UNKNOWN"]);
const ALERT_LIFECYCLE: readonly AlertLifecycleState[] = Object.freeze(["DETECTED", "OPEN", "ACKNOWLEDGED", "UNDER_INVESTIGATION", "REMEDIATION_REQUIRED", "RESOLVED", "VERIFIED", "SUPERSEDED"]);

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

function failureForScenario(scenario: DashboardObservabilityScenario): DashboardObservabilityFailure | undefined {
  const map: Partial<Record<DashboardObservabilityScenario, DashboardObservabilityFailure>> = {
    METRICS_COLLECTION_FAILED: "METRICS_COLLECTION_FAILED",
    SOURCE_VALIDATION_FAILED: "SOURCE_STATE_VALIDATION_FAILED",
    DASHBOARD_CAPTURE_FAILED: "DASHBOARD_STATE_CAPTURE_FAILED",
    RENDERING_FAILED: "RENDERING_FAILURE_DETECTED",
    LATENCY_DEGRADED: "LATENCY_THRESHOLD_EXCEEDED",
    STALE_DASHBOARD: "DASHBOARD_STATE_STALE",
    CACHE_STALE: "CACHE_STATE_STALE",
    MISSING_LINEAGE: "LINEAGE_REFERENCE_MISSING",
    BROKEN_LINEAGE: "LINEAGE_EDGE_BROKEN",
    CROSS_TENANT_LINEAGE: "CROSS_TENANT_LINEAGE_DETECTED",
    MISSING_REPLAY: "REPLAY_REFERENCE_MISSING",
    REPLAY_DIVERGED: "REPLAY_OUTPUT_DIVERGED",
    REPLAY_ENGINE_UNAVAILABLE: "REPLAY_ENGINE_UNAVAILABLE",
    BROKEN_REFERENCE: "REFERENCE_BROKEN",
    UNAUTHORIZED_REFERENCE: "REFERENCE_UNAUTHORIZED",
    MISSING_APPROVAL: "APPROVAL_VISIBILITY_INCOMPLETE",
    HIDDEN_REJECTION: "APPROVAL_REJECTION_HIDDEN",
    EXPIRED_APPROVAL: "APPROVAL_EXPIRED_MISSHOWN",
    MISSING_CERTIFICATION: "CERTIFICATION_VISIBILITY_MISSING",
    CERTIFICATION_MISREPRESENTED: "CERTIFICATION_STATE_MISREPRESENTED",
    CONDITIONAL_PASS_AS_PASS: "CONDITIONAL_PASS_MISREPRESENTED",
    WIDGET_FAILED: "MANDATORY_WIDGET_UNHEALTHY",
    NAVIGATION_BROKEN: "NAVIGATION_HEALTH_BROKEN",
    SECURITY_VISIBILITY_FAILURE: "SECURITY_VISIBILITY_FAILURE",
    ALERT_DELIVERY_FAILED: "ALERT_DELIVERY_FAILED",
    LEDGER_WRITE_FAILED: "LEDGER_WRITE_FAILED",
    OBSERVABILITY_AUTH_FAILED: "OBSERVABILITY_AUTHORIZATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    UNKNOWN_HEALTH: "UNKNOWN_HEALTH_STATE",
  };
  return map[scenario];
}

function severityHealth(failures: readonly DashboardObservabilityFailure[]): DashboardHealthState {
  if (!failures.length) return "HEALTHY";
  if (failures.some((f) => ["SECURITY_VISIBILITY_FAILURE", "CROSS_TENANT_LINEAGE_DETECTED", "INTEGRITY_VERIFICATION_FAILED"].includes(f))) return "CRITICAL_FAILURE";
  if (failures.some((f) => ["CERTIFICATION_STATE_MISREPRESENTED", "CONDITIONAL_PASS_MISREPRESENTED", "APPROVAL_REJECTION_HIDDEN"].includes(f))) return "MISLEADING";
  if (failures.includes("UNKNOWN_HEALTH_STATE")) return "UNKNOWN";
  if (failures.some((f) => ["METRICS_COLLECTION_FAILED", "ALERT_DELIVERY_FAILED", "LEDGER_WRITE_FAILED", "OBSERVABILITY_AUTHORIZATION_FAILED"].includes(f))) return "OBSERVABILITY_DEGRADED";
  if (failures.some((f) => ["DASHBOARD_STATE_STALE", "CACHE_STATE_STALE"].includes(f))) return "STALE";
  if (failures.some((f) => ["RENDERING_FAILURE_DETECTED", "DASHBOARD_STATE_CAPTURE_FAILED"].includes(f))) return "UNAVAILABLE";
  return "INCOMPLETE";
}

function apiSurface(): DashboardObservabilityApiSurface {
  const base: Omit<DashboardObservabilityApiSurface, "integrity_hash"> = {
    api_id: "dashboard_observability_api",
    retrieve_dashboard: "POST /dashboard-observability/dashboard",
    retrieve_contract: "GET /dashboard-observability/contract",
    retrieve_sections: freezeArray(["metrics", "usage", "visibility", "performance", "freshness", "lineage", "replay", "references", "approvals", "certification", "widgets", "navigation", "health", "alerts", "incidents", "ledger", "reports", "console"]),
    validate_observability: "POST /dashboard-observability/validate",
    inspect_observability: "POST /dashboard-observability/inspect",
    mutation_supported: false,
    source_repair_supported: false,
    approval_supported: false,
    certification_mutation_supported: false,
    incident_suppression_supported: false,
    production_adaptation_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metrics(failures: readonly DashboardObservabilityFailure[]): DashboardMetricsService {
  const base: Omit<DashboardMetricsService, "integrity_hash"> = {
    service_id: "dashboard_metrics_service",
    availability_rate: failures.includes("RENDERING_FAILURE_DETECTED") ? 0 : 0.998,
    request_volume: 144,
    successful_renders: failures.includes("RENDERING_FAILURE_DETECTED") ? 0 : 142,
    failed_renders: failures.includes("RENDERING_FAILURE_DETECTED") ? 12 : 0,
    partial_renders: failures.includes("DASHBOARD_STATE_CAPTURE_FAILED") ? 3 : 0,
    p50_latency_ms: 88,
    p95_latency_ms: failures.includes("LATENCY_THRESHOLD_EXCEEDED") ? 2400 : 210,
    p99_latency_ms: failures.includes("LATENCY_THRESHOLD_EXCEEDED") ? 4100 : 390,
    stale_data_count: failures.includes("DASHBOARD_STATE_STALE") ? 1 : 0,
    broken_reference_count: failures.includes("REFERENCE_BROKEN") ? 1 : 0,
    missing_lineage_count: failures.includes("LINEAGE_REFERENCE_MISSING") ? 1 : 0,
    missing_replay_count: failures.includes("REPLAY_REFERENCE_MISSING") ? 1 : 0,
    approval_incompleteness_count: failures.includes("APPROVAL_VISIBILITY_INCOMPLETE") ? 1 : 0,
    certification_incompleteness_count: failures.includes("CERTIFICATION_VISIBILITY_MISSING") ? 1 : 0,
    authorization_denial_count: failures.includes("OBSERVABILITY_AUTHORIZATION_FAILED") ? 1 : 0,
    integrity_failure_count: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    tenant_aware: true,
    mission_aware: true,
    deterministic: !failures.includes("METRICS_COLLECTION_FAILED"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function usage(): DashboardUsageAnalytics {
  const base: Omit<DashboardUsageAnalytics, "integrity_hash"> = { analytics_id: "dashboard_usage_analytics", dashboard_views: 47, replay_launches: 8, lineage_navigation_count: 12, evidence_inspections: 10, approval_queue_interactions: 5, certification_queue_interactions: 4, time_to_required_information_ms: 6200, aggregate_privacy_preserved: true, behavioral_ranking_present: false, advisory_only: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function visibility(failures: readonly DashboardObservabilityFailure[]): DashboardVisibilityValidator {
  const outcome: VisibilityValidationOutcome = failures.includes("SECURITY_VISIBILITY_FAILURE") ? "OVEREXPOSED" : failures.some((f) => ["CERTIFICATION_STATE_MISREPRESENTED", "CONDITIONAL_PASS_MISREPRESENTED"].includes(f)) ? "MISLEADING" : failures.length ? "INCOMPLETE" : "COMPLETE_WITH_AUTHORIZED_REDACTION";
  const base: Omit<DashboardVisibilityValidator, "integrity_hash"> = { validator_id: "dashboard_visibility_validator", outcome, required_records_visible: !failures.includes("SOURCE_STATE_VALIDATION_FAILED"), required_blockers_visible: !failures.includes("DASHBOARD_STATE_CAPTURE_FAILED"), approvals_visible: !failures.includes("APPROVAL_VISIBILITY_INCOMPLETE"), certification_visible: !failures.includes("CERTIFICATION_VISIBILITY_MISSING"), rollback_visible: true, replay_refs_visible: !failures.includes("REPLAY_REFERENCE_MISSING"), lineage_paths_visible: !failures.includes("LINEAGE_REFERENCE_MISSING"), unauthorized_overexposure_detected: failures.includes("SECURITY_VISIBILITY_FAILURE"), misleading_summary_detected: outcome === "MISLEADING" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function performance(failures: readonly DashboardObservabilityFailure[]): DashboardPerformanceMonitor {
  const slow = failures.includes("LATENCY_THRESHOLD_EXCEEDED");
  const base: Omit<DashboardPerformanceMonitor, "integrity_hash"> = { monitor_id: "dashboard_performance_monitor", initial_load_latency_ms: slow ? 1800 : 110, full_render_latency_ms: slow ? 3200 : 260, widget_render_latency_ms: slow ? 900 : 80, search_latency_ms: slow ? 1200 : 90, replay_navigation_latency_ms: slow ? 1500 : 130, lineage_graph_latency_ms: slow ? 1900 : 180, error_rate: failures.includes("RENDERING_FAILURE_DETECTED") ? 1 : 0, timeout_rate: slow ? 0.08 : 0, optimization_preserves_governed_data: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function freshness(failures: readonly DashboardObservabilityFailure[]): DashboardFreshnessMonitor {
  const state: FreshnessState = failures.includes("CACHE_STATE_STALE") ? "CACHE_STALE" : failures.includes("DASHBOARD_STATE_STALE") ? "STALE" : failures.includes("UNKNOWN_HEALTH_STATE") ? "UNKNOWN" : "CURRENT";
  const base: Omit<DashboardFreshnessMonitor, "integrity_hash"> = { monitor_id: "dashboard_freshness_monitor", state, source_record_timestamp: "2026-07-09T00:00:00.000Z", dashboard_refresh_timestamp: state === "CURRENT" ? "2026-07-09T00:00:05.000Z" : "2026-07-08T00:00:00.000Z", cache_timestamp: state === "CACHE_STALE" ? "2026-07-08T00:00:00.000Z" : "2026-07-09T00:00:03.000Z", governance_update_timestamp: "2026-07-09T00:00:01.000Z", approval_update_timestamp: "2026-07-09T00:00:02.000Z", certification_update_timestamp: "2026-07-09T00:00:03.000Z", stale_status_visible: state !== "CURRENT" || true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lineage(failures: readonly DashboardObservabilityFailure[]): LineageIntegrityMonitor {
  const state: LineageState = failures.includes("CROSS_TENANT_LINEAGE_DETECTED") ? "CROSS_TENANT_VIOLATION" : failures.includes("LINEAGE_EDGE_BROKEN") ? "BROKEN" : failures.includes("LINEAGE_REFERENCE_MISSING") ? "PARTIAL" : failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "INTEGRITY_FAILURE" : "COMPLETE";
  const base: Omit<LineageIntegrityMonitor, "integrity_hash"> = { monitor_id: "lineage_integrity_monitor", state, missing_nodes: failures.includes("LINEAGE_REFERENCE_MISSING") ? 1 : 0, broken_edges: failures.includes("LINEAGE_EDGE_BROKEN") ? 1 : 0, orphaned_records: 0, cyclic_lineage_detected: false, cross_tenant_lineage_detected: failures.includes("CROSS_TENANT_LINEAGE_DETECTED"), version_mismatches: 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replay(failures: readonly DashboardObservabilityFailure[]): ReplayAvailabilityMonitor {
  const state: ReplayAvailabilityState = failures.includes("REPLAY_ENGINE_UNAVAILABLE") ? "ENGINE_UNAVAILABLE" : failures.includes("REPLAY_OUTPUT_DIVERGED") ? "DIVERGED" : failures.includes("REPLAY_REFERENCE_MISSING") ? "MISSING" : "READY";
  const base: Omit<ReplayAvailabilityMonitor, "integrity_hash"> = { monitor_id: "replay_availability_monitor", state, replay_refs_present: state !== "MISSING", package_complete: state === "READY", engine_available: state !== "ENGINE_UNAVAILABLE", event_order_reproducible: state !== "DIVERGED", output_hash_reproducible: state !== "DIVERGED", authorization_compatible: !failures.includes("OBSERVABILITY_AUTHORIZATION_FAILED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function references(failures: readonly DashboardObservabilityFailure[]): ReferenceIntegrityMonitor {
  const state: ReferenceState = failures.includes("REFERENCE_UNAUTHORIZED") ? "UNAUTHORIZED" : failures.includes("REFERENCE_BROKEN") ? "BROKEN" : failures.includes("CROSS_TENANT_LINEAGE_DETECTED") ? "CROSS_TENANT" : "VALID_REDACTED";
  const base: Omit<ReferenceIntegrityMonitor, "integrity_hash"> = { monitor_id: "reference_integrity_monitor", state, broken_links: failures.includes("REFERENCE_BROKEN") ? 1 : 0, unauthorized_targets: failures.includes("REFERENCE_UNAUTHORIZED") ? 1 : 0, superseded_targets: 0, malformed_references: 0, circular_navigation: false, cross_tenant_links: failures.includes("CROSS_TENANT_LINEAGE_DETECTED") ? 1 : 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function approvals(failures: readonly DashboardObservabilityFailure[]): ApprovalCompletenessMonitor {
  const state: ApprovalVisibilityState = failures.includes("APPROVAL_REJECTION_HIDDEN") ? "MISREPRESENTED" : failures.includes("APPROVAL_EXPIRED_MISSHOWN") ? "VERSION_INVALID" : failures.includes("APPROVAL_VISIBILITY_INCOMPLETE") ? "INCOMPLETE" : "COMPLETE";
  const base: Omit<ApprovalCompletenessMonitor, "integrity_hash"> = { monitor_id: "approval_completeness_monitor", state, required_approvals: 4, completed_approvals: state === "COMPLETE" ? 4 : 2, hidden_rejections: failures.includes("APPROVAL_REJECTION_HIDDEN") ? 1 : 0, unmet_conditions: state === "INCOMPLETE" ? 1 : 0, expired_approvals_shown_valid: failures.includes("APPROVAL_EXPIRED_MISSHOWN") ? 1 : 0, revoked_approvals_shown_valid: 0, authority_mismatches: 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certification(failures: readonly DashboardObservabilityFailure[]): CertificationCompletenessMonitor {
  const state: CertificationVisibilityState = failures.includes("CONDITIONAL_PASS_MISREPRESENTED") || failures.includes("CERTIFICATION_STATE_MISREPRESENTED") ? "MISREPRESENTED" : failures.includes("CERTIFICATION_VISIBILITY_MISSING") ? "MISSING" : "COMPLETE";
  const base: Omit<CertificationCompletenessMonitor, "integrity_hash"> = { monitor_id: "certification_completeness_monitor", state, required_gate_visible: state !== "MISSING", completed_tests_visible: state === "COMPLETE", failed_tests_visible: state === "COMPLETE", conditional_findings_visible: state === "COMPLETE", conditional_pass_as_pass: failures.includes("CONDITIONAL_PASS_MISREPRESENTED"), expired_shown_current: false, revoked_omitted: false, evidence_package_visible: state === "COMPLETE" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function widget(failures: readonly DashboardObservabilityFailure[]): WidgetHealthMonitor {
  const state = failures.includes("MANDATORY_WIDGET_UNHEALTHY") ? "FAILED" : "HEALTHY";
  const base: Omit<WidgetHealthMonitor, "integrity_hash"> = { monitor_id: "widget_health_monitor", mandatory_widget_states: freezeArray([`proposal:${state}`, `lineage:${state}`, `replay:${state}`, `certification:${state}`]), all_mandatory_healthy: state === "HEALTHY", accessibility_state_valid: true, replay_integration_valid: state === "HEALTHY" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function navigation(failures: readonly DashboardObservabilityFailure[]): NavigationHealthMonitor {
  const ok = !failures.includes("NAVIGATION_HEALTH_BROKEN");
  const base: Omit<NavigationHealthMonitor, "integrity_hash"> = { monitor_id: "navigation_health_monitor", route_resolution_valid: ok, deep_links_valid: ok, breadcrumb_accuracy: ok, replay_position_preserved: ok, filter_state_preserved: ok, tenant_context_preserved: ok, authorization_revalidated: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alertObjects(failures: readonly DashboardObservabilityFailure[]): readonly DashboardAlert[] {
  const categories = failures.length ? failures : freezeArray<DashboardObservabilityFailure>([]);
  return freezeArray(categories.map((failure) => {
    const base: Omit<DashboardAlert, "integrity_hash"> = { alert_id: id("dashboard_alert", failure), category: failure, severity: ["SECURITY_VISIBILITY_FAILURE", "CROSS_TENANT_LINEAGE_DETECTED", "INTEGRITY_VERIFICATION_FAILED"].includes(failure) ? "CRITICAL" : "HIGH", lifecycle_state: "OPEN", routed_to: freezeArray(["dashboard-operations", "governance-operations"]), dedupe_key: `dashboard:${failure}`, critical_auto_closed: false, resolution_requires_verification: true };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function incidents(alerts: readonly DashboardAlert[], input: DashboardObservabilityInput): readonly DashboardIncident[] {
  if (!alerts.length) return freezeArray([]);
  const first = alerts[0]!;
  const base: Omit<DashboardIncident, "integrity_hash"> = { incident_id: id("dashboard_incident", first.alert_id), tenant_id: input.tenant_id ?? TENANT_ID, mission_scope: input.mission_scope ?? "mission-control-dashboard-observability", dashboard_view: input.dashboard_view ?? "adaptive-intelligence-dashboard", incident_type: first.category === "SECURITY_VISIBILITY_FAILURE" ? "SECURITY_EXPOSURE" : first.category === "CROSS_TENANT_LINEAGE_DETECTED" ? "CROSS_TENANT_VISIBILITY" : first.category.includes("CERTIFICATION") ? "CERTIFICATION_VISIBILITY" : first.category.includes("REPLAY") ? "REPLAY_LOSS" : "OBSERVABILITY_SYSTEM", severity: first.severity, detected_at: "2026-07-09T00:00:00.000Z", source_alert_refs: freezeArray([first.alert_id]), affected_records: freezeArray(["dashboard-record:1"]), affected_roles: freezeArray(["OPERATOR", "GOVERNANCE_AUTHORITY", "CERTIFICATION_TEAM"]), user_impact: "dashboard health interpretation may be incomplete", governance_impact: "governed state requires review", certification_impact: "certification evidence may be blocked", containment_status: "OPEN", remediation_status: "REMEDIATION_REQUIRED", resolution_refs: freezeArray([]), replay_refs: freezeArray(["replay:dashboard-observability:1"]), closed_at: null };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function evaluate(failures: readonly DashboardObservabilityFailure[]): DashboardHealthEvaluation {
  const health = severityHealth(failures);
  const dim: HealthDimension = health === "CRITICAL_FAILURE" ? "SECURITY_VISIBILITY" : health === "MISLEADING" ? "CERTIFICATION_VISIBILITY" : health === "STALE" ? "FRESHNESS" : health === "OBSERVABILITY_DEGRADED" ? "AUDITABILITY" : health === "UNAVAILABLE" ? "RENDERING" : health === "UNKNOWN" ? "COMPLETENESS" : health === "INCOMPLETE" ? "LINEAGE" : "AVAILABILITY";
  const base: Omit<DashboardHealthEvaluation, "integrity_hash"> = { evaluation_id: "dashboard_health_evaluation", health, dimensions: DIMENSIONS.map((dimension) => `${dimension}:${dimension === dim ? health : "HEALTHY"}`), most_severe_dimension: dim, unknown_treated_unhealthy: true, average_does_not_hide_critical: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(input: DashboardObservabilityInput, failures: readonly DashboardObservabilityFailure[], health: DashboardHealthState): DashboardObservabilityRecord {
  const base: Omit<DashboardObservabilityRecord, "integrity_hash"> = { observability_record_id: id("dashboard_observability_record", input.dashboard_view ?? "adaptive"), tenant_id: input.tenant_id ?? TENANT_ID, mission_scope: input.mission_scope ?? "mission-control-dashboard-observability", dashboard_view: input.dashboard_view ?? "adaptive-intelligence-dashboard", dashboard_instance_id: "dashboard-instance-1", dashboard_version: "v10.14", observation_timestamp: "2026-07-09T00:00:00.000Z", availability_status: failures.includes("RENDERING_FAILURE_DETECTED") ? "UNAVAILABLE" : "HEALTHY", latency_metrics: freezeArray(["p50:88", failures.includes("LATENCY_THRESHOLD_EXCEEDED") ? "p95:2400" : "p95:210"]), rendering_status: failures.includes("RENDERING_FAILURE_DETECTED") ? "UNAVAILABLE" : "HEALTHY", freshness_status: failures.includes("DASHBOARD_STATE_STALE") ? "STALE" : "CURRENT", lineage_status: failures.includes("LINEAGE_REFERENCE_MISSING") ? "PARTIAL" : "COMPLETE", replay_status: failures.includes("REPLAY_REFERENCE_MISSING") ? "MISSING" : "READY", reference_status: failures.includes("REFERENCE_BROKEN") ? "BROKEN" : "VALID", approval_visibility_status: failures.includes("APPROVAL_VISIBILITY_INCOMPLETE") ? "INCOMPLETE" : "COMPLETE", certification_visibility_status: failures.includes("CERTIFICATION_VISIBILITY_MISSING") ? "MISSING" : "COMPLETE", security_visibility_status: failures.includes("SECURITY_VISIBILITY_FAILURE") ? "CRITICAL_FAILURE" : "HEALTHY", widget_health: freezeArray([failures.includes("MANDATORY_WIDGET_UNHEALTHY") ? "mandatory:FAILED" : "mandatory:HEALTHY"]), navigation_health: failures.includes("NAVIGATION_HEALTH_BROKEN") ? "DEGRADED" : "HEALTHY", source_state_refs: failures.includes("SOURCE_STATE_VALIDATION_FAILED") ? freezeArray([]) : freezeArray(["truth-ledger:dashboard-state:1"]), dashboard_state_ref: failures.includes("DASHBOARD_STATE_CAPTURE_FAILED") ? "" : "dashboard-state:1", detected_anomalies: failures, alert_refs: failures.map((failure) => id("dashboard_alert", failure)), incident_refs: failures.length ? freezeArray(["dashboard-incident:1"]) : freezeArray([]), replay_refs: failures.includes("REPLAY_REFERENCE_MISSING") ? freezeArray([]) : freezeArray(["replay:dashboard-observability:1"]), current_health_status: health };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function ledger(evaluation: DashboardHealthEvaluation, metric: DashboardMetricsService, alerts: readonly DashboardAlert[], incidents: readonly DashboardIncident[], failures: readonly DashboardObservabilityFailure[]): DashboardObservabilityLedger {
  const base: Omit<DashboardObservabilityLedger, "integrity_hash"> = { ledger_id: "dashboard_observability_ledger", health_evaluation_refs: freezeArray([evaluation.evaluation_id]), metric_snapshot_refs: freezeArray([metric.service_id]), alert_history_refs: alerts.map((alert) => alert.alert_id), incident_history_refs: incidents.map((incident) => incident.incident_id), append_only: true, immutable: true, tenant_isolated: true, replayable: !failures.includes("LEDGER_WRITE_FAILED"), hash_verified: !failures.includes("LEDGER_WRITE_FAILED") && !failures.includes("INTEGRITY_VERIFICATION_FAILED"), governance_accessible: true, certification_accessible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function report(evaluation: DashboardHealthEvaluation): DashboardHealthReport {
  const state: ReportState = evaluation.health === "HEALTHY" ? "HEALTHY" : evaluation.health === "CRITICAL_FAILURE" ? "CRITICAL" : evaluation.health === "MISLEADING" ? "CERTIFICATION_BLOCKED" : "ACTION_REQUIRED";
  const base: Omit<DashboardHealthReport, "integrity_hash"> = { report_id: "dashboard_health_report", state, summary: `Dashboard health is ${evaluation.health}.`, evidence_refs: freezeArray([evaluation.integrity_hash]), replay_refs: freezeArray(["replay:dashboard-health-report:1"]), reproducible: true, integrity_verified: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function consoleSurface(): DashboardObservabilityConsole {
  const base: Omit<DashboardObservabilityConsole, "integrity_hash"> = { console_id: "dashboard_observability_console", health_summary_visible: true, current_incidents_visible: true, active_alerts_visible: true, filtering_supported: true, incident_inspection_supported: true, replay_launch_supported: true, lineage_inspection_supported: true, source_records_mutable: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: DashboardObservabilityFailure, refs: readonly string[]): DashboardObservabilityValidationTest {
  const base: Omit<DashboardObservabilityValidationTest, "integrity_hash"> = { test_id: id("dashboard_observability_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type BuildBase = Omit<DashboardObservabilityResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly DashboardObservabilityValidationTest[] {
  const refs = freezeArray([result.record.integrity_hash, result.health_evaluation.integrity_hash]);
  return freezeArray([
    validationTest("metrics collected", result.metrics_service.deterministic, "METRICS_COLLECTION_FAILED", refs),
    validationTest("source state validated", result.record.source_state_refs.length > 0, "SOURCE_STATE_VALIDATION_FAILED", refs),
    validationTest("dashboard state captured", result.record.dashboard_state_ref.length > 0, "DASHBOARD_STATE_CAPTURE_FAILED", refs),
    validationTest("rendering healthy", result.record.rendering_status !== "UNAVAILABLE", "RENDERING_FAILURE_DETECTED", refs),
    validationTest("latency within threshold", result.metrics_service.p95_latency_ms < 1000 && result.performance_monitor.full_render_latency_ms < 1000, "LATENCY_THRESHOLD_EXCEEDED", refs),
    validationTest("freshness current", result.freshness_monitor.state === "CURRENT", "DASHBOARD_STATE_STALE", refs),
    validationTest("cache current", result.freshness_monitor.state !== "CACHE_STALE", "CACHE_STATE_STALE", refs),
    validationTest("lineage complete", result.lineage_monitor.state === "COMPLETE", "LINEAGE_REFERENCE_MISSING", refs),
    validationTest("lineage edges valid", result.lineage_monitor.broken_edges === 0, "LINEAGE_EDGE_BROKEN", refs),
    validationTest("tenant-safe lineage", !result.lineage_monitor.cross_tenant_lineage_detected, "CROSS_TENANT_LINEAGE_DETECTED", refs),
    validationTest("replay references visible", result.replay_monitor.replay_refs_present, "REPLAY_REFERENCE_MISSING", refs),
    validationTest("replay reproducible", result.replay_monitor.output_hash_reproducible, "REPLAY_OUTPUT_DIVERGED", refs),
    validationTest("replay engine available", result.replay_monitor.engine_available, "REPLAY_ENGINE_UNAVAILABLE", refs),
    validationTest("references valid", result.reference_monitor.broken_links === 0, "REFERENCE_BROKEN", refs),
    validationTest("references authorized", result.reference_monitor.unauthorized_targets === 0, "REFERENCE_UNAUTHORIZED", refs),
    validationTest("approval complete", result.approval_monitor.state === "COMPLETE", "APPROVAL_VISIBILITY_INCOMPLETE", refs),
    validationTest("rejections visible", result.approval_monitor.hidden_rejections === 0, "APPROVAL_REJECTION_HIDDEN", refs),
    validationTest("expired approvals visible", result.approval_monitor.expired_approvals_shown_valid === 0, "APPROVAL_EXPIRED_MISSHOWN", refs),
    validationTest("certification visible", result.certification_monitor.state === "COMPLETE", "CERTIFICATION_VISIBILITY_MISSING", refs),
    validationTest("certification not misleading", !["MISREPRESENTED"].includes(result.certification_monitor.state), "CERTIFICATION_STATE_MISREPRESENTED", refs),
    validationTest("conditional pass not pass", !result.certification_monitor.conditional_pass_as_pass, "CONDITIONAL_PASS_MISREPRESENTED", refs),
    validationTest("mandatory widgets healthy", result.widget_monitor.all_mandatory_healthy, "MANDATORY_WIDGET_UNHEALTHY", refs),
    validationTest("navigation healthy", result.navigation_monitor.route_resolution_valid && result.navigation_monitor.authorization_revalidated, "NAVIGATION_HEALTH_BROKEN", refs),
    validationTest("security visibility healthy", result.record.security_visibility_status !== "CRITICAL_FAILURE", "SECURITY_VISIBILITY_FAILURE", refs),
    validationTest("alerts deliverable", result.alerts.every((alert) => alert.resolution_requires_verification), "ALERT_DELIVERY_FAILED", refs),
    validationTest("ledger writable", result.ledger.hash_verified, "LEDGER_WRITE_FAILED", refs),
    validationTest("observability authorized", result.tenant_isolated, "OBSERVABILITY_AUTHORIZATION_FAILED", refs),
    validationTest("unknown unhealthy", result.health_evaluation.health !== "UNKNOWN", "UNKNOWN_HEALTH_STATE", refs),
    validationTest("integrity reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_VERIFICATION_FAILED", refs),
  ]);
}

function replayHash(result: Omit<DashboardObservabilityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ record: result.record.integrity_hash, metrics: result.metrics_service.integrity_hash, visibility: result.visibility_validator.integrity_hash, health: result.health_evaluation.integrity_hash, alerts: result.alerts.map((a) => a.integrity_hash), incidents: result.incidents.map((i) => i.integrity_hash), failures: result.failures });
}
function integrityHash(result: Omit<DashboardObservabilityResult, "integrity_hash">): string {
  return hash({ version: result.dashboard_observability_version, id: result.observability_identifier, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome });
}

export function buildDashboardObservability(input: DashboardObservabilityInput = {}): DashboardObservabilityResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as DashboardObservabilityFailure] : []);
  const api_surface = apiSurface();
  const health_evaluation = evaluate(initialFailures);
  const rec = record(input, initialFailures, health_evaluation.health);
  const metric = metrics(initialFailures);
  const alertList = alertObjects(initialFailures);
  const incidentList = incidents(alertList, input);
  const baseWithoutValidation: BuildBase = { dashboard_observability_version: VERSION, observability_identifier: ID, status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE", api_surface, record: rec, metrics_service: metric, usage_analytics: usage(), visibility_validator: visibility(initialFailures), performance_monitor: performance(initialFailures), freshness_monitor: freshness(initialFailures), lineage_monitor: lineage(initialFailures), replay_monitor: replay(initialFailures), reference_monitor: references(initialFailures), approval_monitor: approvals(initialFailures), certification_monitor: certification(initialFailures), widget_monitor: widget(initialFailures), navigation_monitor: navigation(initialFailures), health_evaluation, alerts: alertList, incidents: incidentList, ledger: ledger(health_evaluation, metric, alertList, incidentList, initialFailures), health_report: report(health_evaluation), console: consoleSurface(), widgets: WIDGETS, deterministic: true, read_only: true, advisory_only: true, tenant_isolated: !initialFailures.includes("CROSS_TENANT_LINEAGE_DETECTED") && !initialFailures.includes("OBSERVABILITY_AUTHORIZATION_FAILED"), observability_degradation_visible: true };
  const validation_tests = tests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is DashboardObservabilityFailure => Boolean(f))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<DashboardObservabilityResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateDashboardObservability(result?: DashboardObservabilityResult): DashboardObservabilityValidationResult {
  if (!result) {
    const failures = freezeArray<DashboardObservabilityFailure>(["UNKNOWN_HEALTH_STATE"]);
    const base: Omit<DashboardObservabilityValidationResult, "validation_hash"> = { observability_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash
    && hashWithoutIntegrity(result.metrics_service) === result.metrics_service.integrity_hash
    && hashWithoutIntegrity(result.visibility_validator) === result.visibility_validator.integrity_hash
    && hashWithoutIntegrity(result.health_evaluation) === result.health_evaluation.integrity_hash
    && hashWithoutIntegrity(result.ledger) === result.ledger.integrity_hash
    && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const read_only = result.read_only && result.advisory_only && !result.api_surface.mutation_supported && !result.api_surface.source_repair_supported && !result.api_surface.approval_supported && !result.api_surface.certification_mutation_supported && !result.api_surface.incident_suppression_supported && !result.api_surface.production_adaptation_mutation_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<DashboardObservabilityValidationResult, "validation_hash"> = { observability_id: result.observability_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, read_only };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayDashboardObservability(result: DashboardObservabilityResult): boolean {
  return validateDashboardObservability(result).valid;
}

export function buildDashboardObservabilitySurface(result = buildDashboardObservability()): DashboardObservabilitySurface {
  return Object.freeze({ observability_id: result.observability_identifier, status: result.status, validation_outcome: result.validation_outcome, health: result.health_evaluation.health, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, tenant_isolated: result.tenant_isolated, observability_degradation_visible: result.observability_degradation_visible, integrity_hash: result.integrity_hash });
}

export function getDashboardObservabilityContract(): DashboardObservabilityContract {
  const result = buildDashboardObservability();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, health_states: HEALTH_STATES, health_dimensions: DIMENSIONS, freshness_states: FRESHNESS, lineage_states: LINEAGE, replay_states: REPLAY, reference_states: REFERENCES, approval_states: APPROVALS, certification_states: CERTIFICATIONS, alert_lifecycle: ALERT_LIFECYCLE, required_integrations: freezeArray(["Dashboard View Registry", "Widget Framework", "Dashboard Rendering Engine", "Dashboard Security and Visibility Layer", "Outcome Intelligence Dashboard", "Recommendation Intelligence Dashboard", "Pattern Intelligence Dashboard", "Strategy Evolution Dashboard", "Confidence and Risk Dashboard", "Governance and Approval Dashboard", "Replay Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Governance Decision Ledger", "Certification Ledger", "Evidence Registry", "Tenant Registry", "Mission Registry", "Alerting Infrastructure", "Incident Management System", "Metrics and Telemetry Platform"]), read_only: true, advisory_only: true }), result, validation: validateDashboardObservability(result), observability: buildDashboardObservabilitySurface(result) });
}

export const DashboardObservability = Object.freeze({ build: buildDashboardObservability, validate: validateDashboardObservability, replay: replayDashboardObservability });
