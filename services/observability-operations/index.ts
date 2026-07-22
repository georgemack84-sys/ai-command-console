import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayReplayIntegrityExplainability, runReplayIntegrityExplainability, validateReplayIntegrityExplainability } from "@/services/replay-integrity-explainability";
import type {
  ObservabilityOperationsBundle,
  ObservabilityOperationsFailure,
  ObservabilityOperationsInput,
  ObservabilityOperationsResult,
  ObservabilityOperationsValidation,
  OperationalAlert,
  OperationalAlertCategory,
  OperationalAlertSeverity,
  OperationalCertificationOutcome,
  OperationalCertificationTest,
  OperationalComponent,
  OperationalDashboardView,
  OperationalMonitor,
  OperationalObservationRecord,
  OperationalRunbook,
  OperationalStatus,
} from "@/types/observability-operations";

const VERSION = "observability-operations/v14.11" as const;
const IDENTIFIER = "ObservabilityOperations" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_14_synthetic_validation" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ObservabilityOperationsFailure[], failure: ObservabilityOperationsFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ObservabilityOperationsInput["scenario"]): ObservabilityOperationsFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ObservabilityOperationsFailure[]): OperationalCertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OPERATIONAL_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const dashboardViews = freezeArray(["Validation Overview", "Environment Status", "Scenario Execution", "Replay Health", "Certification Status", "Dependency Health", "Integrity Status", "Boundary Violations", "Remediation Progress", "Alert Summary"] as const satisfies readonly OperationalDashboardView[]);
const alertCategories = freezeArray(["VALIDATION_ALERT", "DEPENDENCY_ALERT", "REPLAY_ALERT", "CERTIFICATION_ALERT", "LINEAGE_ALERT", "INTEGRITY_ALERT", "GOVERNANCE_ALERT", "BOUNDARY_ALERT", "REMEDIATION_ALERT", "SUPERSESSION_ALERT"] as const satisfies readonly OperationalAlertCategory[]);
const alertSeverities = freezeArray(["INFORMATION", "WARNING", "HIGH", "CRITICAL"] as const satisfies readonly OperationalAlertSeverity[]);
const runbookNames = freezeArray(["Validation Failure Response", "Replay Divergence Investigation", "Dependency Verification Failure", "Certification Failure", "Boundary Violation Response", "Integrity Investigation", "Remediation Workflow", "Supersession Verification", "Alert Escalation", "Operational Recovery"] as const);
const runbookSections = freezeArray(["detection", "evidence collection", "investigation", "replay validation", "governance escalation", "remediation", "certification impact", "closure"] as const);

function statusFor(failures: readonly ObservabilityOperationsFailure[], failure: ObservabilityOperationsFailure): OperationalStatus {
  if (has(failures, failure)) return failure.includes("WARNING") ? "WATCH" : "BLOCKED";
  return "HEALTHY";
}
function severityFor(status: OperationalStatus, failure?: ObservabilityOperationsFailure): OperationalAlertSeverity {
  if (status === "BLOCKED") return failure === "CONSTITUTIONAL_BOUNDARY_BREACH" || failure === "TENANT_ISOLATION_BROKEN" ? "CRITICAL" : "HIGH";
  if (status === "WATCH") return "WARNING";
  return "INFORMATION";
}
function certTest(name: string, passed: boolean, failure: ObservabilityOperationsFailure): OperationalCertificationTest {
  const actual: OperationalCertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OPERATIONAL_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("operational_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}
function resultReplayHash(result: Omit<ObservabilityOperationsResult, "replay_hash" | "integrity_hash">): string {
  return hash({ upstream: result.replay_integrity_ref, dashboard: result.dashboard.integrity_hash, monitors: result.monitors.map((m) => m.integrity_hash), alerts: result.alerts.map((a) => a.integrity_hash), runbooks: result.runbooks.map((r) => r.integrity_hash), ledger: result.evidence_ledger.map((e) => e.integrity_hash), tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ObservabilityOperationsResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runObservabilityOperations(input: ObservabilityOperationsInput = {}): ObservabilityOperationsResult {
  const replay = runReplayIntegrityExplainability();
  const replayValidation = validateReplayIntegrityExplainability(replay);
  const replayable = replayReplayIntegrityExplainability(replay);
  const direct = directFailure(input.scenario);
  const upstreamFailures: ObservabilityOperationsFailure[] = replayValidation.valid && replayable ? [] : ["REPLAY_NOT_REPRODUCIBLE"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenant_id = has(failures, "TENANT_ISOLATION_BROKEN") ? "cross_tenant_scope" : input.tenant_id ?? DEFAULT_TENANT;
  const evidenceRef = replay.integrity_hash;
  const replayRef = replay.replay_hash;
  const lineageRef = replay.certification_lineage_ref;
  const dashboard = nested({ dashboard_id: id("operational_dashboard", tenant_id), tenant_id, views: has(failures, "DASHBOARD_COVERAGE_INCOMPLETE") ? dashboardViews.slice(0, 8) : dashboardViews, widget_registry: freezeArray(dashboardViews.map((view) => id("widget", view))), layout_engine: "DETERMINISTIC_GRID" as const, rendering_service: "READ_ONLY_RENDERER" as const, state_manager: "IMMUTABLE_DASHBOARD_STATE" as const, deterministic_rendering: !has(failures, "ALERTS_NON_DETERMINISTIC"), tenant_isolated: !has(failures, "TENANT_ISOLATION_BROKEN"), execution_authority: false as const });
  const monitorSpecs: readonly [OperationalComponent, readonly string[], readonly string[], ObservabilityOperationsFailure][] = [
    ["VALIDATION_PROGRESS", ["validation lifecycle", "completed validations", "active validations", "pending validations", "blocked validations", "failed validations", "validation duration", "validation throughput"], ["validation completion rate", "validation latency", "validation success rate", "execution backlog"], "VALIDATION_NOT_OBSERVABLE"],
    ["DEPENDENCY_VERIFICATION", ["dependency verification", "unresolved dependencies", "blocked implementations", "dependency failures", "candidate dependency status", "manifest verification status", "dependency supersession"], ["dependency completion", "dependency latency", "dependency failure rate"], "DEPENDENCY_VISIBILITY_INCOMPLETE"],
    ["REPLAY_HEALTH", ["replay execution", "replay success", "replay divergence", "deterministic replay", "replay latency", "replay failures", "explanation availability"], ["replay stability", "divergence rate", "replay reproducibility"], "REPLAY_MONITORING_DEGRADED"],
    ["LINEAGE_INTEGRITY", ["lineage completeness", "supersession chain health", "certification ancestry", "integrity validation", "immutable history", "audit completeness"], ["lineage completeness score", "integrity verification rate", "supersession consistency"], "LINEAGE_MONITORING_INCOMPLETE"],
    ["BOUNDARY_VIOLATION", ["advisory-only enforcement", "execution attempts", "boundary violations", "interface protection", "authority violations", "containment status"], ["violation count", "containment latency", "unresolved violations"], "BOUNDARY_MONITORING_INCOMPLETE"],
    ["CERTIFICATION_REMEDIATION", ["certification progress", "certification outcomes", "remediation backlog", "remediation completion", "supersession readiness", "replay readiness"], ["certification completion", "remediation latency", "open remediation count"], "CERTIFICATION_NOT_VISIBLE"],
  ] as const;
  const monitors = freezeArray(monitorSpecs.map(([component, monitored_signals, metrics, failure]) => nested({ monitor_id: id("operational_monitor", component), component, monitored_signals: has(failures, failure) ? monitored_signals.slice(0, -1) : monitored_signals, metrics, status: statusFor(failures, failure), deterministic: !has(failures, "ALERTS_NON_DETERMINISTIC"), evidence_refs: freezeArray([evidenceRef]), replay_refs: freezeArray([replayRef]) } satisfies Omit<OperationalMonitor, "integrity_hash">)));
  const alerts = freezeArray(alertCategories.map((category, index) => {
    const failure = failures[index % Math.max(failures.length, 1)];
    const status = failures.length && index < failures.length ? statusFor(failures, failure) : "HEALTHY";
    return nested({ alert_id: id("operational_alert", { category, status }), category, severity: severityFor(status, failure), status, explanation: status === "HEALTHY" ? `${category} evaluated deterministically with immutable evidence.` : `${category} surfaced ${failure} with replay and lineage evidence.`, affected_artifacts: freezeArray([dashboard.dashboard_id, replay.integrity_hash]), evidence_refs: freezeArray([evidenceRef]), replay_refs: freezeArray([replayRef]), lineage_refs: freezeArray([lineageRef]), deterministic: !has(failures, "ALERTS_NON_DETERMINISTIC") } satisfies Omit<OperationalAlert, "integrity_hash">);
  }));
  const runbooks = freezeArray(runbookNames.map((name) => nested({ runbook_id: id("operational_runbook", name), name, sections: has(failures, "RUNBOOKS_INCOMPLETE") ? runbookSections.slice(0, 6) : runbookSections, deterministic: true, advisory_only: !has(failures, "CONSTITUTIONAL_BOUNDARY_BREACH") } satisfies Omit<OperationalRunbook, "integrity_hash">)));
  const ledger = freezeArray(dashboardViews.map((view, index) => nested({ observation_id: id("operational_observation", { tenant_id, view }), tenant_id, observation_timestamp: TIMESTAMP, dashboard_view: view, monitored_component: index === 9 ? "ALERT_MANAGEMENT" as const : index === 8 ? "CERTIFICATION_REMEDIATION" as const : "OPERATIONAL_DASHBOARD" as const, observation_type: index === 9 ? "ALERT_EVALUATED" as const : "DASHBOARD_RENDERED" as const, observed_status: has(failures, "EVIDENCE_LEDGER_MUTABLE") ? "DEGRADED" as const : "HEALTHY" as const, severity: has(failures, "EVIDENCE_LEDGER_MUTABLE") ? "HIGH" as const : "INFORMATION" as const, evidence_refs: freezeArray([evidenceRef]), replay_refs: freezeArray([replayRef]), validation_refs: freezeArray([replayValidation.integrity_hash]), certification_refs: freezeArray([replay.certification_tests[0]?.integrity_hash ?? replay.integrity_hash]), lineage_refs: freezeArray([lineageRef]) } satisfies Omit<OperationalObservationRecord, "integrity_hash">)));
  const tests = freezeArray([
    certTest("Dashboard coverage complete", dashboard.views.length === 10 && dashboard.deterministic_rendering, "DASHBOARD_COVERAGE_INCOMPLETE"),
    certTest("Validation monitoring visible", monitors.some((m) => m.component === "VALIDATION_PROGRESS" && m.monitored_signals.length === 8), "VALIDATION_NOT_OBSERVABLE"),
    certTest("Dependency monitoring complete", monitors.some((m) => m.component === "DEPENDENCY_VERIFICATION" && m.monitored_signals.length === 7), "DEPENDENCY_VISIBILITY_INCOMPLETE"),
    certTest("Replay monitoring operational", monitors.some((m) => m.component === "REPLAY_HEALTH" && m.status === "HEALTHY"), "REPLAY_MONITORING_DEGRADED"),
    certTest("Lineage monitoring complete", monitors.some((m) => m.component === "LINEAGE_INTEGRITY" && m.status === "HEALTHY"), "LINEAGE_MONITORING_INCOMPLETE"),
    certTest("Boundary monitoring complete", monitors.some((m) => m.component === "BOUNDARY_VIOLATION" && m.status === "HEALTHY"), "BOUNDARY_MONITORING_INCOMPLETE"),
    certTest("Certification visible", monitors.some((m) => m.component === "CERTIFICATION_REMEDIATION" && m.status === "HEALTHY"), "CERTIFICATION_NOT_VISIBLE"),
    certTest("Remediation traceable", dashboard.views.includes("Remediation Progress") && monitors.some((m) => m.metrics.includes("open remediation count")), "REMEDIATION_NOT_TRACEABLE"),
    certTest("Alerts deterministic", alerts.length === 10 && alerts.every((alert) => alert.deterministic && alert.evidence_refs.length > 0 && alert.replay_refs.length > 0), "ALERTS_NON_DETERMINISTIC"),
    certTest("Runbooks complete", runbooks.length === 10 && runbooks.every((runbook) => runbook.sections.length === 8 && runbook.advisory_only), "RUNBOOKS_INCOMPLETE"),
    certTest("Evidence ledger immutable", ledger.length === 10 && ledger.every((record) => record.observed_status === "HEALTHY"), "EVIDENCE_LEDGER_MUTABLE"),
    certTest("Replay reproducible", replayable && replayValidation.valid, "REPLAY_NOT_REPRODUCIBLE"),
    certTest("Tenant isolation enforced", dashboard.tenant_isolated && ledger.every((record) => record.tenant_id === tenant_id), "TENANT_ISOLATION_BROKEN"),
    certTest("Constitutional compliance preserved", dashboard.execution_authority === false && runbooks.every((runbook) => runbook.advisory_only), "CONSTITUTIONAL_BOUNDARY_BREACH"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((t) => t.failure_reason).filter((failure): failure is ObservabilityOperationsFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ObservabilityOperationsResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, replay_integrity_ref: replay.integrity_hash, dashboard, monitors, alerts, runbooks, evidence_ledger: ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateObservabilityOperations(result = runObservabilityOperations()): ObservabilityOperationsValidation {
  const dashboard_valid = verify(result.dashboard) && result.dashboard.views.length === 10 && result.dashboard.deterministic_rendering && result.dashboard.tenant_isolated && result.dashboard.execution_authority === false;
  const monitors_valid = result.monitors.length === 6 && result.monitors.every((monitor) => verify(monitor) && monitor.status === "HEALTHY" && monitor.deterministic && monitor.evidence_refs.length > 0 && monitor.replay_refs.length > 0);
  const alerts_valid = result.alerts.length === 10 && result.alerts.every((alert) => verify(alert) && alert.deterministic && alert.evidence_refs.length > 0 && alert.replay_refs.length > 0 && alert.lineage_refs.length > 0);
  const runbooks_valid = result.runbooks.length === 10 && result.runbooks.every((runbook) => verify(runbook) && runbook.sections.length === 8 && runbook.deterministic && runbook.advisory_only);
  const ledger_valid = result.evidence_ledger.length === 10 && result.evidence_ledger.every((record) => verify(record) && record.tenant_id === result.dashboard.tenant_id && record.evidence_refs.length > 0 && record.replay_refs.length > 0 && record.validation_refs.length > 0 && record.certification_refs.length > 0 && record.lineage_refs.length > 0);
  const certification_valid = result.certification_tests.length === 14 && result.certification_tests.every((test) => verify(test) && test.passed);
  const replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && replay_valid && dashboard_valid && monitors_valid && alerts_valid && runbooks_valid && ledger_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, dashboard_valid, monitors_valid, alerts_valid, runbooks_valid, ledger_valid, certification_valid, replay_valid, failures: result.failures });
}

export function replayObservabilityOperations(result = runObservabilityOperations()): boolean {
  const replayed = runObservabilityOperations({ tenant_id: result.dashboard.tenant_id });
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateObservabilityOperations(result).valid;
}

export function getObservabilityOperationsBundle(): ObservabilityOperationsBundle {
  const result = runObservabilityOperations();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "replay-integrity-explainability/v14.10" as const, dashboard_views: dashboardViews, alert_categories: alertCategories, alert_severities: alertSeverities, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateObservabilityOperations(result) });
}

export const ObservabilityOperationsService = Object.freeze({ run: runObservabilityOperations, validate: validateObservabilityOperations, replay: replayObservabilityOperations });
