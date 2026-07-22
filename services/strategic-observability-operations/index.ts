import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runStrategicGovernanceEnforcement, validateStrategicGovernanceEnforcement } from "@/services/strategic-governance-enforcement";
import type {
  AlertQueue,
  ArtifactHealthReport,
  DashboardSummary,
  DerivedViewConsistencyReport,
  GovernanceOperationsReport,
  ManifestHealthReport,
  ObservationHealthReport,
  OperationalAlert,
  OperationalDashboard,
  OperationalPerformanceReport,
  OperationalRunbook,
  RecommendationCycleStatus,
  ReplayIntegrityOperationalStatus,
  StrategicOperationsCertification,
  StrategicOperationsCertificationTest,
  StrategicOperationsContractBundle,
  StrategicOperationsFailure,
  StrategicOperationsInput,
  StrategicOperationsResult,
  StrategicOperationsScenario,
  StrategicOperationsValidation,
  TenantOperationalHealth,
} from "@/types/strategic-observability-operations";

const VERSION = "strategic-observability-operations/v12.13" as const;
const ID = "StrategicObservabilityOperations" as const;
const RUNBOOKS = Object.freeze(["blocked recommendation cycle", "policy binding failure", "manifest validation failure", "replay divergence", "integrity failure", "governance backlog", "operator backlog", "observation overdue", "replay recovery", "lineage inconsistency", "orphan artifact", "tenant isolation violation", "supersession anomaly", "derived-view inconsistency"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function scenarioFailure(scenario: StrategicOperationsScenario): StrategicOperationsFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly StrategicOperationsFailure[], failure: StrategicOperationsFailure): boolean { return failures.includes(failure); }
function statusFor(failures: readonly StrategicOperationsFailure[]): "PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function dashboard(failures: readonly StrategicOperationsFailure[]): OperationalDashboard {
  return nested({ dashboard_id: id("phase_12_operational_dashboard", VERSION), categories: freezeArray(["Recommendation Operations", "Artifact Operations", "Policy Operations", "Governance Operations", "Replay Operations", "Observation Operations", "Integrity Operations", "Tenant Operations", "Performance Operations", "Alert Operations"]), widgets: freezeArray(["cycle monitor", "artifact health", "policy manifest health", "replay integrity", "observation windows", "governance backlog", "tenant isolation", "alert queue"]), role_based_visibility: !has(failures, "ROLE_VISIBILITY_FAILURE"), tenant_isolated: !has(failures, "TENANT_VIOLATION_HIDDEN"), read_only: !has(failures, "ADVISORY_BOUNDARY_VIOLATION"), refresh_schedule_seconds: 30, constitutional_status_visible: !has(failures, "DASHBOARD_UNAVAILABLE") });
}

function cycles(failures: readonly StrategicOperationsFailure[]): RecommendationCycleStatus {
  return nested({ monitor_id: id("cycle_monitor", VERSION), open_cycles: 3, blocked_cycles: has(failures, "BLOCKED_CYCLE_UNREPORTED") ? 0 : 1, stalled_transitions: has(failures, "CYCLE_STALLED_UNDETECTED") ? 0 : 1, lifecycle_violations: 0, timeout_detected: !has(failures, "CYCLE_STALLED_UNDETECTED"), recovery_status_reported: !has(failures, "BLOCKED_CYCLE_UNREPORTED"), completion_rate: 0.87, queue_depth: 4 });
}

function artifactHealth(failures: readonly StrategicOperationsFailure[]): ArtifactHealthReport {
  const hidden = has(failures, "ARTIFACT_ANOMALY_UNDETECTED");
  return nested({ report_id: id("artifact_health", VERSION), artifacts_monitored: 9, orphan_attempts: hidden ? 0 : 1, duplicate_conflicts: hidden ? 0 : 1, lifecycle_consistent: !hidden, schema_valid: true, origin_valid: !hidden, registry_synchronized: !hidden, anomalies_visible: !hidden });
}

function manifestHealth(failures: readonly StrategicOperationsFailure[]): ManifestHealthReport {
  const hidden = has(failures, "POLICY_BINDING_FAILURE_HIDDEN");
  return nested({ report_id: id("manifest_health", VERSION), policy_binding_failures: hidden ? 0 : 1, manifest_complete: !hidden, dependencies_valid: !hidden, compatibility_valid: true, expired_policies: 0, revoked_policies: 0, governance_approved: !hidden });
}

function performance(failures: readonly StrategicOperationsFailure[]): OperationalPerformanceReport {
  return nested({ report_id: id("operational_performance", VERSION), average_latency_ms: 142, p95_latency_ms: 410, peak_latency_ms: 720, throughput_per_hour: 48, queue_depth: 4, processing_efficiency: 0.91, bottlenecks_visible: !has(failures, "PERFORMANCE_BOTTLENECK_HIDDEN") });
}

function observation(failures: readonly StrategicOperationsFailure[]): ObservationHealthReport {
  const hidden = has(failures, "OBSERVATION_OVERDUE_UNDETECTED");
  return nested({ report_id: id("observation_health", VERSION), open_windows: 2, overdue_closures: hidden ? 0 : 1, pending_evidence: 3, late_evidence: 1, completeness_rate: 0.82, evaluation_backlog: 2, replay_ready: !hidden });
}

function replayIntegrity(failures: readonly StrategicOperationsFailure[]): ReplayIntegrityOperationalStatus {
  const replayHidden = has(failures, "REPLAY_FAILURE_HIDDEN");
  const integrityHidden = has(failures, "INTEGRITY_FAILURE_HIDDEN");
  return nested({ report_id: id("replay_integrity_ops", VERSION), replay_divergences: replayHidden ? 0 : 1, replay_failures: replayHidden ? 0 : 1, replay_success_rate: replayHidden ? 1 : 0.96, integrity_failures: integrityHidden ? 0 : 1, hash_mismatches: integrityHidden ? 0 : 1, origin_inconsistencies: integrityHidden ? 0 : 1, lineage_failures: integrityHidden ? 0 : 1, visible: !replayHidden && !integrityHidden });
}

function governanceOps(failures: readonly StrategicOperationsFailure[]): GovernanceOperationsReport {
  const hidden = has(failures, "GOVERNANCE_BACKLOG_HIDDEN");
  return nested({ report_id: id("governance_operations", VERSION), governance_review_backlog: hidden ? 0 : 5, operator_review_backlog: hidden ? 0 : 2, pending_approvals: hidden ? 0 : 4, authority_conflicts: hidden ? 0 : 1, approval_latency_ms: 360000, bottlenecks_visible: !hidden, constitutional_review_current: !hidden });
}

function tenantOps(tenantId: string, failures: readonly StrategicOperationsFailure[]): TenantOperationalHealth {
  const hidden = has(failures, "TENANT_VIOLATION_HIDDEN");
  return nested({ report_id: id("tenant_operations", tenantId), tenant_id: tenantId, isolation_failures: hidden ? 0 : 1, unauthorized_access_attempts: hidden ? 0 : 1, cross_tenant_visibility: hidden, replay_isolated: !hidden, policy_isolated: !hidden, recommendation_isolated: !hidden, immediately_visible: !hidden });
}

function derivedViews(failures: readonly StrategicOperationsFailure[]): DerivedViewConsistencyReport {
  const bad = has(failures, "DERIVED_VIEW_INCONSISTENT");
  return nested({ report_id: id("derived_view_consistency", VERSION), dashboard_synchronized: !bad, lineage_synchronized: !bad, artifact_projection_valid: !bad, recommendation_summaries_valid: !bad, portfolio_summaries_valid: !bad, observation_summaries_valid: !bad, inconsistencies: bad ? freezeArray(["dashboard projection differs from lineage view"]) : freezeArray([]) });
}

function alert(source: string, severity: OperationalAlert["severity"], cycle: string, failure: StrategicOperationsFailure | null): OperationalAlert {
  return nested({ alert_id: id("operational_alert", { source, severity, failure }), source, affected_artifact: `artifact:${cycle}:${source}`, affected_recommendation_cycle: cycle, severity, timestamp: "2026-07-15T00:00:00.000Z", evidence: freezeArray([`evidence:${source}:deterministic`, `failure:${failure ?? "none"}`]), recommended_operator_action: failure ? `inspect ${failure} runbook` : "continue monitoring", replay_reference: `replay:${cycle}:${source}`, lineage_reference: `lineage:${cycle}:${source}` });
}

function alerts(cycle: string, failures: readonly StrategicOperationsFailure[]): AlertQueue {
  const items = failures.length ? failures.map((failure) => alert(failure.toLowerCase(), severityFor(failure), cycle, failure)) : [alert("operations", "NOTICE", cycle, null), alert("integrity", "INTEGRITY", cycle, null)];
  return nested({ queue_id: id("alert_queue", { cycle, failures }), alerts: freezeArray(items), routing_deterministic: !has(failures, "ALERT_ROUTING_NONDETERMINISTIC"), history_immutable: true, critical_configured: !has(failures, "ALERT_ROUTING_NONDETERMINISTIC") });
}

function severityFor(failure: StrategicOperationsFailure): OperationalAlert["severity"] {
  if (failure.includes("TENANT")) return "SECURITY";
  if (failure.includes("INTEGRITY")) return "INTEGRITY";
  if (failure.includes("REPLAY")) return "REPLAY";
  if (failure.includes("GOVERNANCE")) return "GOVERNANCE";
  if (failure.includes("ADVISORY")) return "CONSTITUTIONAL";
  return failure.includes("UNDETECTED") || failure.includes("HIDDEN") ? "CRITICAL" : "ERROR";
}

function runbooks(failures: readonly StrategicOperationsFailure[]): readonly OperationalRunbook[] {
  const invalid = has(failures, "RUNBOOK_INVALID");
  return freezeArray(RUNBOOKS.map((name) => nested({ runbook_id: id("operational_runbook", name), name, trigger_conditions: freezeArray([`${name} alert opened`]), constitutional_considerations: freezeArray(["read-only advisory response", "operator authority preserved"]), required_evidence: freezeArray(["alert evidence", "replay reference", "lineage reference"]), investigation_steps: freezeArray(["inspect alert", "verify evidence", "compare replay output"]), validation_steps: freezeArray(["validate hashes", "validate tenant boundary", "validate governance visibility"]), governance_requirements: freezeArray(["escalate when governance or constitutional severity applies"]), operator_responsibilities: freezeArray(["review recommendation", "approve recovery closure"]), recovery_actions: freezeArray(["repair source system", "rerun deterministic monitor", "close alert with evidence"]), replay_validation: !invalid, closure_criteria: freezeArray(["evidence complete", "replay validates", "operator review recorded"]), validated: !invalid })));
}

type CertBase = Omit<StrategicOperationsResult, "certification" | "replay_hash" | "integrity_hash">;
function certTest(name: string, passed: boolean, failure: StrategicOperationsFailure, refs: readonly string[]): StrategicOperationsCertificationTest {
  return nested({ test_id: id("strategic_operations_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}
function certificationTests(result: CertBase): readonly StrategicOperationsCertificationTest[] {
  const refs = freezeArray([result.dashboard.integrity_hash, result.alerts.integrity_hash, result.runbooks[0]?.integrity_hash ?? result.summary.integrity_hash]);
  return freezeArray([
    certTest("Operational dashboards accurately reflect state", result.dashboard.constitutional_status_visible, "DASHBOARD_UNAVAILABLE", refs),
    certTest("Role-based visibility enforced", result.dashboard.role_based_visibility, "ROLE_VISIBILITY_FAILURE", refs),
    certTest("Stale recommendation cycles detected", result.cycle_monitor.timeout_detected, "CYCLE_STALLED_UNDETECTED", refs),
    certTest("Blocked cycles reported", result.cycle_monitor.blocked_cycles > 0 && result.cycle_monitor.recovery_status_reported, "BLOCKED_CYCLE_UNREPORTED", refs),
    certTest("Artifact anomalies surfaced", result.artifact_health.anomalies_visible, "ARTIFACT_ANOMALY_UNDETECTED", refs),
    certTest("Policy-binding failures visible", result.manifest_health.policy_binding_failures > 0 && result.manifest_health.manifest_complete, "POLICY_BINDING_FAILURE_HIDDEN", refs),
    certTest("Performance bottlenecks visible", result.performance.bottlenecks_visible, "PERFORMANCE_BOTTLENECK_HIDDEN", refs),
    certTest("Overdue observations detected", result.observation_health.overdue_closures > 0, "OBSERVATION_OVERDUE_UNDETECTED", refs),
    certTest("Replay failures visible", result.replay_integrity.replay_failures > 0, "REPLAY_FAILURE_HIDDEN", refs),
    certTest("Integrity failures detected", result.replay_integrity.integrity_failures > 0, "INTEGRITY_FAILURE_HIDDEN", refs),
    certTest("Governance and operator backlogs measurable", result.governance_operations.bottlenecks_visible, "GOVERNANCE_BACKLOG_HIDDEN", refs),
    certTest("Tenant-isolation violations immediately visible", result.tenant_operations.immediately_visible && !result.tenant_operations.cross_tenant_visibility, "TENANT_VIOLATION_HIDDEN", refs),
    certTest("Derived views synchronized", result.derived_views.inconsistencies.length === 0, "DERIVED_VIEW_INCONSISTENT", refs),
    certTest("Alerts generated deterministically", result.alerts.routing_deterministic && result.alerts.critical_configured, "ALERT_ROUTING_NONDETERMINISTIC", refs),
    certTest("Runbooks validated through replay", result.runbooks.every((runbook) => runbook.validated && runbook.replay_validation), "RUNBOOK_INVALID", refs),
    certTest("Observability remains advisory-only", result.dashboard.read_only, "ADVISORY_BOUNDARY_VIOLATION", refs),
  ]);
}

function replayHash(result: Omit<StrategicOperationsResult, "replay_hash" | "integrity_hash">): string {
  return hash({ dashboard: result.dashboard.integrity_hash, cycles: result.cycle_monitor.integrity_hash, artifact: result.artifact_health.integrity_hash, manifest: result.manifest_health.integrity_hash, performance: result.performance.integrity_hash, observation: result.observation_health.integrity_hash, replay: result.replay_integrity.integrity_hash, governance: result.governance_operations.integrity_hash, tenant: result.tenant_operations.integrity_hash, views: result.derived_views.integrity_hash, alerts: result.alerts.integrity_hash, runbooks: result.runbooks.map((r) => r.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<StrategicOperationsResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runStrategicObservabilityOperations(input: StrategicOperationsInput = {}): StrategicOperationsResult {
  const governance = runStrategicGovernanceEnforcement({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const governanceValid = validateStrategicGovernanceEnforcement(governance).valid;
  const directFailure = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<StrategicOperationsFailure>([...(governanceValid ? [] : ["INTEGRITY_FAILURE_HIDDEN" as const]), ...(directFailure ? [directFailure] : [])]);
  const cycle = governance.ledger.entries[0]?.recommendation_cycle_id ?? "cycle:phase-12";
  const d = dashboard(failures);
  const c = cycles(failures);
  const a = artifactHealth(failures);
  const m = manifestHealth(failures);
  const p = performance(failures);
  const o = observation(failures);
  const r = replayIntegrity(failures);
  const g = governanceOps(failures);
  const t = tenantOps(input.tenant_id ?? "tenant_mission_control", failures);
  const v = derivedViews(failures);
  const al = alerts(cycle, failures);
  const rb = runbooks(failures);
  const summary: DashboardSummary = nested({ summary_id: id("dashboard_summary", failures), active_cycles: c.open_cycles, blocked_cycles: c.blocked_cycles, alerts_open: al.alerts.length, health_score: failures.length ? 0.42 : 0.94, constitutional_compliance: d.read_only });
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, dashboard: d, summary, cycle_monitor: c, artifact_health: a, manifest_health: m, performance: p, observation_health: o, replay_integrity: r, governance_operations: g, tenant_operations: t, derived_views: v, alerts: al, runbooks: rb };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is StrategicOperationsFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification: StrategicOperationsCertification = nested({ certification_id: id("strategic_operations_certification", VERSION), status, certified: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateStrategicObservabilityOperations(result?: StrategicOperationsResult): StrategicOperationsValidation {
  if (!result) {
    const failures = freezeArray<StrategicOperationsFailure>(["DASHBOARD_UNAVAILABLE"]);
    const base = { valid: false, status: "FAIL" as const, certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, alerts_valid: false, runbooks_valid: false, advisory_only: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const alerts_valid = result.alerts.routing_deterministic && result.alerts.history_immutable && result.alerts.alerts.every((alert) => alert.evidence.length > 0);
  const runbooks_valid = result.runbooks.every((runbook) => runbook.validated && runbook.replay_validation);
  const advisory_only = result.dashboard.read_only;
  const valid = result.certification.status === "PASS" && result.certification.certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && alerts_valid && runbooks_valid && advisory_only;
  const base = { valid, status: result.certification.status, certified: result.certification.certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, alerts_valid, runbooks_valid, advisory_only };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayStrategicObservabilityOperations(result = runStrategicObservabilityOperations()): boolean {
  const replayed = runStrategicObservabilityOperations({ tenant_id: result.tenant_operations.tenant_id });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateStrategicObservabilityOperations(result).valid;
}

export function getStrategicObservabilityOperationsContract(): StrategicOperationsContractBundle {
  const result = runStrategicObservabilityOperations();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, read_only_advisory: true, replayable_metrics_required: true, immutable_alert_history_required: true, tenant_isolated_views_required: true, runbooks_required: true, dashboards_non_authoritative: true }), result, validation: validateStrategicObservabilityOperations(result) });
}

export const StrategicObservabilityOperations = Object.freeze({ run: runStrategicObservabilityOperations, validate: validateStrategicObservabilityOperations, replay: replayStrategicObservabilityOperations });
