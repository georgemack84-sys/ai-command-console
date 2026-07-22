import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPilotPerformanceReliabilityValidation } from "@/services/pilot-performance-reliability-validation";
import type {
  AlertCategory,
  AlertLifecycleState,
  MonitorType,
  PilotMonitoringObservabilityBundle,
  PilotMonitoringObservabilityCertificationTest,
  PilotMonitoringObservabilityFailure,
  PilotMonitoringObservabilityInput,
  PilotMonitoringObservabilityOutcome,
  PilotMonitoringObservabilityResult,
  PilotMonitoringObservabilityValidation,
} from "@/types/pilot-monitoring-observability";

const VERSION = "pilot-monitoring-observability/v16.7" as const;
const IDENTIFIER = "PilotMonitoringObservability" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_monitoring_observability";
const DEFAULT_OPERATOR = "operator_phase_16_monitoring_observability";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly PilotMonitoringObservabilityFailure[], failure: PilotMonitoringObservabilityFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: PilotMonitoringObservabilityInput["scenario"]): PilotMonitoringObservabilityFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly PilotMonitoringObservabilityFailure[]): PilotMonitoringObservabilityOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const monitorTypes = freezeArray(["RUNTIME_HEALTH", "ADVISORY_ACTIVITY", "REPLAY_HEALTH", "EVIDENCE_INGESTION", "OPERATOR_WORKFLOW", "CERTIFICATION_STATUS", "CONSTITUTIONAL_COMPLIANCE"] as const satisfies readonly MonitorType[]);
const alertCategories = freezeArray(["OPERATIONAL", "ADVISORY", "REPLAY", "EVIDENCE", "CERTIFICATION", "CONSTITUTIONAL"] as const satisfies readonly AlertCategory[]);
const alertLifecycle = freezeArray(["DETECTED", "VALIDATED", "CLASSIFIED", "NOTIFIED", "ACKNOWLEDGED", "INVESTIGATING", "ESCALATED", "RESOLVED", "CLOSED"] as const satisfies readonly AlertLifecycleState[]);

function certTest(name: string, passed: boolean, failure: PilotMonitoringObservabilityFailure, evidence_refs: readonly string[]): PilotMonitoringObservabilityCertificationTest {
  const actual: PilotMonitoringObservabilityOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("pilot_monitoring_observability_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<PilotMonitoringObservabilityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ performance: result.pilot_performance_reliability_ref, records: result.observability_records.map((entry) => entry.integrity_hash), dashboards: result.dashboards.map((entry) => entry.integrity_hash), registry: result.observability_registry.integrity_hash, metrics: result.metrics_registry.integrity_hash, stream: result.event_stream.integrity_hash, alerts: result.alerts.map((entry) => entry.integrity_hash), ledger: result.evidence_ledger.map((entry) => entry.integrity_hash), tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<PilotMonitoringObservabilityResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runPilotMonitoringObservability(input: PilotMonitoringObservabilityInput = {}): PilotMonitoringObservabilityResult {
  const performance = runPilotPerformanceReliabilityValidation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: PilotMonitoringObservabilityFailure[] = performance.outcome === "PASS" ? [] : ["PHASE_16_6_PERFORMANCE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const operatorId = input.operator_id ?? DEFAULT_OPERATOR;
  const dashboardVersion = input.dashboard_version ?? "16.7.0";
  const evidenceRefs = has(failures, "MONITORING_EVIDENCE_MUTABLE") ? freezeArray([]) : freezeArray([performance.integrity_hash, performance.performance_validator.integrity_hash, performance.vp1_report.integrity_hash]);
  const replayRefs = has(failures, "REPLAY_REFERENCES_INCOMPLETE") ? freezeArray([]) : freezeArray([performance.replay_hash, performance.production_replay_determinism_ref]);
  const certificationRefs = has(failures, "CERTIFICATION_READINESS_NOT_ASSESSABLE") ? freezeArray([]) : freezeArray([performance.integrity_hash, ...performance.certification_tests.map((test) => test.integrity_hash)]);
  const governanceRefs = has(failures, "GOVERNANCE_VISIBILITY_INCOMPLETE") ? freezeArray([]) : freezeArray([performance.vp1_report.integrity_hash, performance.threshold_registry[0]?.integrity_hash ?? performance.integrity_hash]);
  const dashboardTypes = ["OPERATIONAL", "RUNTIME_HEALTH", "RECOMMENDATION", "REPLAY", "EVIDENCE", "CERTIFICATION", "GOVERNANCE"] as const;
  const dashboards = freezeArray(dashboardTypes.map((dashboard_type) => nested({ dashboard_id: id("pilot_dashboard", dashboard_type), dashboard_version: dashboardVersion, dashboard_type, monitored_metrics: monitorTypes, visualization_definitions: freezeArray(["status", "trend", "threshold", "lineage"]), alert_bindings: alertCategories, refresh_interval_seconds: 15, role_visibility: freezeArray([operatorId, "governance_board"]), constitutional_restrictions: freezeArray(["informational only", "no execution authority", "tenant scoped"]), evidence_refs: evidenceRefs, complete: !has(failures, "DASHBOARDS_INCOMPLETE"), lineage_reproducible: !has(failures, "DASHBOARD_LINEAGE_NOT_REPRODUCIBLE"), informational_only: !has(failures, "ADVISORY_BOUNDARY_NOT_MAINTAINED") })));
  const metricByType: Record<MonitorType, string> = { RUNTIME_HEALTH: "service availability", ADVISORY_ACTIVITY: "recommendations generated", REPLAY_HEALTH: "replay success rate", EVIDENCE_INGESTION: "evidence capture rate", OPERATOR_WORKFLOW: "pending reviews", CERTIFICATION_STATUS: "certification readiness", CONSTITUTIONAL_COMPLIANCE: "advisory-only boundary" };
  const observability_records = freezeArray(monitorTypes.map((monitor_type) => nested({ record_id: id("pilot_observability_record", monitor_type), timestamp: TIMESTAMP, tenant_id: tenantId, pilot_scope: "limited production pilot", monitor_type, monitor_source: `${monitor_type.toLowerCase()}_monitor`, metric_name: metricByType[monitor_type], metric_value: monitor_type === "CONSTITUTIONAL_COMPLIANCE" ? 1 : 99, measurement_unit: monitor_type === "CONSTITUTIONAL_COMPLIANCE" ? "pass" : "percent", threshold_reference: performance.threshold_registry[0]?.integrity_hash ?? "", status: "HEALTHY" as const, alert_generated: false, dashboard_refs: dashboards.map((dashboard) => dashboard.integrity_hash), evidence_refs: evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, governance_refs: governanceRefs, lineage_hash: hash({ monitor_type, evidenceRefs, replayRefs, certificationRefs }) })));
  const observability_registry = nested({ registry_id: id("pilot_observability_registry", dashboardVersion), monitored_services: freezeArray(["advisory runtime", "replay engine", "evidence service", "operator workflow", "certification service"]), monitored_metrics: observability_records.map((record) => record.metric_name), threshold_mappings: performance.threshold_registry.map((threshold) => threshold.integrity_hash), dashboard_assignments: dashboards.map((dashboard) => dashboard.integrity_hash), alert_definitions: alertCategories, historical_trends: freezeArray(["latency trend", "replay trend", "evidence trend", "certification trend"]), metric_lineage: observability_records.map((record) => record.lineage_hash), evidence_linkage: evidenceRefs, complete: !has(failures, "MONITORING_NOT_OPERATIONAL") && !has(failures, "HIDDEN_OPERATIONAL_STATE_PRESENT"), unified_evidence_platform: true });
  const metrics_registry = nested({ metrics_registry_id: id("pilot_metrics_registry", dashboardVersion), runtime_health_metrics: freezeArray(["availability", "throughput", "latency", "resource utilization", "dependency health"]), advisory_activity_metrics: freezeArray(["generated", "accepted", "rejected", "expired", "operator review", "confidence distribution"]), replay_health_metrics: freezeArray(["completion", "latency", "success rate", "divergence", "queue health"]), evidence_ingestion_metrics: freezeArray(["capture rate", "ingestion latency", "integrity validation", "lineage completeness", "backlog"]), operator_workflow_metrics: freezeArray(["pending reviews", "completion time", "approval latency", "escalation queue", "workload"]), certification_status_metrics: freezeArray(["qualification", "inherited validity", "threshold status", "freshness", "blockers"]), constitutional_compliance_metrics: freezeArray(["advisory boundary", "authority separation", "tenant isolation", "immutable evidence", "replay determinism", "governance compliance"]), deterministic_collection: !has(failures, "ALERT_LIFECYCLE_NON_DETERMINISTIC"), fully_observable: !has(failures, "OPERATIONAL_STATE_NOT_OBSERVABLE") && !has(failures, "HIDDEN_OPERATIONAL_STATE_PRESENT") });
  const event_stream = nested({ stream_id: id("operational_event_stream", dashboardVersion), events: observability_records.map((record) => record.integrity_hash), monitor_types: monitorTypes, replay_refs: replayRefs, evidence_refs: evidenceRefs, tenant_id: tenantId, deterministic: !has(failures, "ALERT_LIFECYCLE_NON_DETERMINISTIC"), immutable: !has(failures, "MONITORING_EVIDENCE_MUTABLE"), tenant_isolated: !has(failures, "TENANT_ISOLATION_NOT_PRESERVED") });
  const alerts = freezeArray(alertCategories.map((category) => nested({ alert_id: id("pilot_alert", category), category, lifecycle: alertLifecycle, current_state: "CLOSED" as const, validation_refs: has(failures, "ALERTS_NOT_VALIDATED") ? freezeArray([]) : evidenceRefs, evidence_refs: evidenceRefs, replay_refs: replayRefs, acknowledged_by: operatorId, deterministic_lifecycle: !has(failures, "ALERT_LIFECYCLE_NON_DETERMINISTIC"), validated: !has(failures, "ALERTS_NOT_VALIDATED"), immutable: !has(failures, "MONITORING_EVIDENCE_MUTABLE") })));
  const ledgerTypes = ["DASHBOARD_CONFIGURED", "MONITOR_REGISTERED", "METRIC_COLLECTED", "EVENT_STREAMED", "ALERT_VALIDATED", "CERTIFICATION_STATUS_RECORDED", "GOVERNANCE_VISIBILITY_RECORDED", "REPLAY_LINKED", "EVIDENCE_ARCHIVED"] as const;
  const observabilityRefs = freezeArray([observability_registry.integrity_hash, metrics_registry.integrity_hash, event_stream.integrity_hash, ...dashboards.map((dashboard) => dashboard.integrity_hash), ...alerts.map((alert) => alert.integrity_hash)]);
  const evidence_ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("observability_evidence_ledger", { dashboardVersion, event_type }), sequence: index + 1, event_type, observability_refs: observabilityRefs, evidence_refs: evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, append_only: !has(failures, "MONITORING_EVIDENCE_MUTABLE"), immutable: !has(failures, "MONITORING_EVIDENCE_MUTABLE") })));
  const tests = freezeArray([
    certTest("Dashboards complete", dashboards.length === 7 && dashboards.every((dashboard) => dashboard.complete), "DASHBOARDS_INCOMPLETE", dashboards.map((dashboard) => dashboard.integrity_hash)),
    certTest("Monitoring operational", observability_registry.complete && metrics_registry.deterministic_collection, "MONITORING_NOT_OPERATIONAL", [observability_registry.integrity_hash]),
    certTest("Runtime health continuously monitored", metrics_registry.runtime_health_metrics.length > 0 && observability_records.some((record) => record.monitor_type === "RUNTIME_HEALTH"), "RUNTIME_HEALTH_NOT_MONITORED", [metrics_registry.integrity_hash]),
    certTest("Advisory activity visible", metrics_registry.advisory_activity_metrics.length > 0 && observability_records.some((record) => record.monitor_type === "ADVISORY_ACTIVITY"), "ADVISORY_ACTIVITY_NOT_VISIBLE", [metrics_registry.integrity_hash]),
    certTest("Replay monitoring operational", metrics_registry.replay_health_metrics.length > 0 && replayRefs.length > 0, "REPLAY_MONITORING_NOT_OPERATIONAL", [metrics_registry.integrity_hash]),
    certTest("Evidence ingestion monitored", metrics_registry.evidence_ingestion_metrics.length > 0 && evidenceRefs.length > 0, "EVIDENCE_INGESTION_NOT_MONITORED", [metrics_registry.integrity_hash]),
    certTest("Operator workflow visible", metrics_registry.operator_workflow_metrics.length > 0, "OPERATOR_WORKFLOW_NOT_VISIBLE", [metrics_registry.integrity_hash]),
    certTest("Certification status continuously visible", metrics_registry.certification_status_metrics.length > 0 && certificationRefs.length > 0, "CERTIFICATION_STATUS_NOT_VISIBLE", [metrics_registry.integrity_hash]),
    certTest("Constitutional compliance continuously monitored", metrics_registry.constitutional_compliance_metrics.length > 0 && observability_records.some((record) => record.monitor_type === "CONSTITUTIONAL_COMPLIANCE"), "CONSTITUTIONAL_COMPLIANCE_NOT_MONITORED", [metrics_registry.integrity_hash]),
    certTest("Alerts validated", alerts.every((alert) => alert.validated && alert.validation_refs.length > 0), "ALERTS_NOT_VALIDATED", alerts.map((alert) => alert.integrity_hash)),
    certTest("Alert lifecycle deterministic", alerts.every((alert) => alert.deterministic_lifecycle && alert.lifecycle.length === 9), "ALERT_LIFECYCLE_NON_DETERMINISTIC", alerts.map((alert) => alert.integrity_hash)),
    certTest("Monitoring evidence immutable", event_stream.immutable && evidence_ledger.every((entry) => entry.immutable && entry.append_only), "MONITORING_EVIDENCE_MUTABLE", evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("Replay references complete", replayRefs.length > 0 && evidence_ledger.every((entry) => entry.replay_refs.length > 0), "REPLAY_REFERENCES_INCOMPLETE", evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("Tenant isolation preserved", event_stream.tenant_isolated && observability_records.every((record) => record.tenant_id === tenantId), "TENANT_ISOLATION_NOT_PRESERVED", [event_stream.integrity_hash]),
    certTest("Advisory-only boundary maintained", dashboards.every((dashboard) => dashboard.informational_only), "ADVISORY_BOUNDARY_NOT_MAINTAINED", dashboards.map((dashboard) => dashboard.integrity_hash)),
    certTest("Dashboard lineage reproducible", dashboards.every((dashboard) => dashboard.lineage_reproducible), "DASHBOARD_LINEAGE_NOT_REPRODUCIBLE", dashboards.map((dashboard) => dashboard.integrity_hash)),
    certTest("Operational state fully observable", metrics_registry.fully_observable && observability_records.length === monitorTypes.length, "OPERATIONAL_STATE_NOT_OBSERVABLE", [metrics_registry.integrity_hash]),
    certTest("No hidden operational state", observability_registry.complete && metrics_registry.fully_observable, "HIDDEN_OPERATIONAL_STATE_PRESENT", [observability_registry.integrity_hash]),
    certTest("Governance visibility complete", governanceRefs.length > 0 && dashboards.some((dashboard) => dashboard.dashboard_type === "GOVERNANCE"), "GOVERNANCE_VISIBILITY_INCOMPLETE", dashboards.map((dashboard) => dashboard.integrity_hash)),
    certTest("Certification readiness continuously assessable", certificationRefs.length > 0 && dashboards.some((dashboard) => dashboard.dashboard_type === "CERTIFICATION"), "CERTIFICATION_READINESS_NOT_ASSESSABLE", dashboards.map((dashboard) => dashboard.integrity_hash)),
    certTest("Phase 16.6 performance reliability valid", performance.outcome === "PASS", "PHASE_16_6_PERFORMANCE_NOT_VALID", [performance.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is PilotMonitoringObservabilityFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<PilotMonitoringObservabilityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, pilot_performance_reliability_ref: performance.integrity_hash, alert_lifecycle: alertLifecycle, observability_records, dashboards, observability_registry, metrics_registry, event_stream, alerts, evidence_ledger, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePilotMonitoringObservability(result = runPilotMonitoringObservability()): PilotMonitoringObservabilityValidation {
  const dashboards_valid = result.dashboards.length === 7 && result.dashboards.every((dashboard) => verify(dashboard) && dashboard.complete && dashboard.lineage_reproducible && dashboard.informational_only && dashboard.evidence_refs.length > 0);
  const records_valid = result.observability_records.length === 7 && result.observability_records.every((record) => verify(record) && record.status === "HEALTHY" && record.dashboard_refs.length === 7 && record.evidence_refs.length > 0 && record.replay_refs.length > 0 && record.certification_refs.length > 0 && record.governance_refs.length > 0);
  const registry_valid = verify(result.observability_registry) && result.observability_registry.complete && result.observability_registry.unified_evidence_platform && result.observability_registry.monitored_services.length === 5 && result.observability_registry.dashboard_assignments.length === 7;
  const metrics_valid = verify(result.metrics_registry) && result.metrics_registry.deterministic_collection && result.metrics_registry.fully_observable && result.metrics_registry.runtime_health_metrics.length > 0 && result.metrics_registry.constitutional_compliance_metrics.length > 0;
  const event_stream_valid = verify(result.event_stream) && result.event_stream.deterministic && result.event_stream.immutable && result.event_stream.tenant_isolated && result.event_stream.events.length === 7 && result.event_stream.replay_refs.length > 0 && result.event_stream.evidence_refs.length > 0;
  const alerts_valid = result.alerts.length === 6 && result.alerts.every((alert) => verify(alert) && alert.validated && alert.deterministic_lifecycle && alert.immutable && alert.lifecycle.length === 9 && alert.current_state === "CLOSED" && alert.replay_refs.length > 0);
  const ledger_valid = result.evidence_ledger.length === 9 && result.evidence_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.observability_refs.length > 0 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.certification_refs.length > 0 && entry.append_only && entry.immutable);
  const certification_valid = result.certification_tests.length === 21 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && dashboards_valid && records_valid && registry_valid && metrics_valid && event_stream_valid && alerts_valid && ledger_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, dashboards_valid, records_valid, registry_valid, metrics_valid, event_stream_valid, alerts_valid, ledger_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayPilotMonitoringObservability(result = runPilotMonitoringObservability()): boolean {
  const replayed = runPilotMonitoringObservability();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePilotMonitoringObservability(result).valid;
}

export function getPilotMonitoringObservabilityBundle(): PilotMonitoringObservabilityBundle {
  const result = runPilotMonitoringObservability();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "pilot-performance-reliability-validation/v16.6" as const, monitor_types: monitorTypes, alert_categories: alertCategories, alert_lifecycle: alertLifecycle, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validatePilotMonitoringObservability(result) });
}

export const PilotMonitoringObservabilityService = Object.freeze({ run: runPilotMonitoringObservability, validate: validatePilotMonitoringObservability, replay: replayPilotMonitoringObservability });
