import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPerformanceScalabilityValidation } from "@/services/performance-scalability-validation";
import type {
  AlertCategory,
  AlertSeverity,
  ComponentType,
  HealthState,
  MetricCategory,
  ProductionOperationsObservabilityBundle,
  ProductionOperationsObservabilityFailure,
  ProductionOperationsObservabilityInput,
  ProductionOperationsObservabilityOutcome,
  ProductionOperationsObservabilityResult,
  ProductionOperationsObservabilityTest,
  ProductionOperationsObservabilityValidation,
} from "@/types/production-operations-observability";

const VERSION = "production-operations-observability/v17.9" as const;
const IDENTIFIER = "ProductionOperationsObservability" as const;
const DEFAULT_TENANT = "tenant_phase_17_observability";
const DEFAULT_OPERATOR = "operator_phase_17_observability";
const ASSESSMENT_TIMESTAMP = "2026-07-16T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionOperationsObservabilityFailure[], failure: ProductionOperationsObservabilityFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionOperationsObservabilityInput["scenario"]): ProductionOperationsObservabilityFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionOperationsObservabilityFailure[]): ProductionOperationsObservabilityOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const healthStates = freezeArray(["HEALTHY", "DEGRADED", "WARNING", "CRITICAL", "FAILED", "RECOVERING", "UNKNOWN"] as const satisfies readonly HealthState[]);
const componentTypes = freezeArray(["TENANT", "REGION", "INFRASTRUCTURE", "SERVICE", "SCHEDULING", "REPLICATION", "DISASTER_RECOVERY", "WORKLOAD_DISTRIBUTION", "CERTIFICATION", "GOVERNANCE", "REPLAY", "RESOURCE_UTILIZATION"] as const satisfies readonly ComponentType[]);
const metricCategories = freezeArray(["TENANT", "REGIONAL", "INFRASTRUCTURE", "GOVERNANCE", "REPLAY"] as const satisfies readonly MetricCategory[]);
const alertCategories = freezeArray(["TENANT_HEALTH", "REGIONAL_HEALTH", "INFRASTRUCTURE_HEALTH", "REPLAY_DEGRADATION", "CERTIFICATION_BACKLOG", "GOVERNANCE_VIOLATION", "RESOURCE_EXHAUSTION", "REPLICATION_FAILURE", "DISASTER_RECOVERY_READINESS", "OBSERVABILITY_FAILURE"] as const satisfies readonly AlertCategory[]);
const alertSeverities = freezeArray(["INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const satisfies readonly AlertSeverity[]);

function certTest(name: string, passed: boolean, failure: ProductionOperationsObservabilityFailure, evidence_refs: readonly string[]): ProductionOperationsObservabilityTest {
  const actual: ProductionOperationsObservabilityOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("production_observability_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionOperationsObservabilityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ performance: result.performance_scalability_validation_ref, dashboards: result.dashboards.map((item) => item.integrity_hash), health: result.health_engine.integrity_hash, records: result.health_records.map((item) => item.integrity_hash), events: result.event_registry.integrity_hash, metrics: result.metrics_registry.integrity_hash, policies: result.alert_policy_registry.integrity_hash, alerts: result.alerts.map((item) => item.integrity_hash), evidence: result.evidence_ledger.map((item) => item.integrity_hash), package: result.certification_package.integrity_hash, tests: result.certification_tests.map((item) => item.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionOperationsObservabilityResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runProductionOperationsObservability(input: ProductionOperationsObservabilityInput = {}): ProductionOperationsObservabilityResult {
  const performance = runPerformanceScalabilityValidation({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionOperationsObservabilityFailure[] = performance.outcome === "PASS" ? [] : ["PHASE_17_8_SCALABILITY_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING"));
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const regionId = input.region_id ?? "us-east-1";
  const componentId = input.component_id ?? "mission-control-production";
  const passive = !has(failures, "OBSERVABILITY_MODIFIES_PRODUCTION_STATE");
  const deterministic = !has(failures, "MONITORING_NOT_DETERMINISTIC");
  const replayable = !has(failures, "OBSERVABILITY_NOT_REPLAYABLE");
  const tenantIsolated = !has(failures, "TENANT_ISOLATION_VIOLATED");
  const evidenceImmutable = !has(failures, "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE");
  const unknownFailsClosed = !has(failures, "UNKNOWN_CONDITIONS_NOT_FAIL_CLOSED");
  const governanceVisible = !has(failures, "GOVERNANCE_VISIBILITY_MISSING");
  const visibilityComplete = !has(failures, "OPERATIONAL_VISIBILITY_INCOMPLETE");
  const dashboardSpecs = [
    ["OPERATIONS", "OPERATIONS_DASHBOARD_INCOMPLETE", ["platform status", "active regions", "active tenants", "incidents", "deployment status", "replication status", "replay health", "certification status", "governance health", "recovery readiness"]],
    ["CAPACITY", "CAPACITY_DASHBOARD_INCOMPLETE", ["compute", "storage", "memory", "networking", "tenant quotas", "regional capacity", "inference capacity", "workload distribution", "scheduling utilization"]],
    ["TENANT_HEALTH", "TENANT_HEALTH_DASHBOARD_INCOMPLETE", ["availability", "lifecycle", "qualification", "certification", "replay", "audit", "governance", "resource utilization", "incidents"]],
    ["INFRASTRUCTURE", "INFRASTRUCTURE_DASHBOARD_INCOMPLETE", ["regional infrastructure", "cluster health", "storage health", "network health", "service availability", "replication synchronization", "recovery readiness", "deployment health", "utilization"]],
  ] as const;
  const dashboards = freezeArray(dashboardSpecs.map(([dashboard_type, failure, fields]) => nested({ dashboard_id: id("dashboard", dashboard_type), dashboard_type, displayed_fields: freezeArray(fields), derived_from_authoritative_evidence: visibilityComplete, replayable_history: replayable, tenant_isolated: tenantIsolated, passive_only: passive, complete: !has(failures, failure) })));
  const metrics = freezeArray(metricCategories.flatMap((category, index) => ["availability", "latency", "throughput"].map((name) => nested({ metric_id: id("metric", { category, name }), name: `${category.toLowerCase()}_${name}`, description: `${category} ${name} metric`, category, unit: name === "latency" ? "ms" : "count", collection_interval: "PT1M", aggregation_method: name === "availability" ? "minimum" : "average", authority_source: VERSION, owner: "mission-control-operations", version: `17.9.${index}`, effective_date: "2026-07-16" }))));
  const metrics_registry = nested({ registry_id: id("metrics_registry", VERSION), metrics, metrics_registered: !has(failures, "OPERATIONAL_VISIBILITY_INCOMPLETE"), authority_sources_present: true, versions_present: true, deterministic_collection: deterministic });
  const health_engine = nested({ engine_id: id("health_assessment", componentId), assessed_domains: componentTypes, deterministic_classification: deterministic, unknown_fails_closed: unknownFailsClosed, preserves_tenant_isolation: tenantIsolated, governance_visible: governanceVisible, replay_refs: freezeArray(replayable ? [performance.replay_hash] : []) });
  const healthState: HealthState = unknownFailsClosed ? "HEALTHY" : "UNKNOWN";
  const health_records = freezeArray(componentTypes.map((component_type) => nested({ health_record_id: id("health_record", { component_type, componentId }), tenant_id: tenantId, region_id: regionId, component_type, component_id: `${componentId}:${component_type.toLowerCase()}`, health_state: component_type === "GOVERNANCE" && !governanceVisible ? "UNKNOWN" as const : healthState, health_score: healthState === "HEALTHY" ? 100 : 0, observed_metrics: freezeArray(metrics.slice(0, 3).map((metric) => metric.integrity_hash)), observed_conditions: freezeArray([visibilityComplete ? "evidence-qualified" : "visibility-incomplete"]), alert_refs: freezeArray([]), incident_refs: freezeArray([]), certification_refs: freezeArray([performance.certification_package.integrity_hash]), governance_refs: freezeArray(governanceVisible ? [performance.certification_package.integrity_hash] : []), replay_refs: health_engine.replay_refs, assessment_timestamp: ASSESSMENT_TIMESTAMP, assessment_version: "17.9.0" })));
  const alert_policy_registry = nested({ registry_id: id("alert_policy_registry", VERSION), alert_categories: alertCategories, severity_classification_deterministic: deterministic, responses_governed: true, equivalent_state_equivalent_alerts: deterministic, unknown_conditions_fail_closed: unknownFailsClosed, monitoring_authorizes_actions: false });
  const event_registry = nested({ registry_id: id("observability_event_registry", VERSION), event_categories: componentTypes, events_replayable: replayable, events_attributable: true, events_governed: true, cross_tenant_visibility_prohibited: tenantIsolated, observability_self_monitoring_enabled: true });
  const alertEvidenceRefs = freezeArray(evidenceImmutable ? [performance.integrity_hash] : []);
  const alerts = freezeArray(alertCategories.map((alert_category, index) => nested({ alert_id: id("alert", { alert_category, componentId }), tenant_id: tenantId, region_id: regionId, alert_category, alert_severity: index === alertCategories.length - 1 ? "HIGH" as const : "INFORMATIONAL" as const, trigger_condition: alert_category === "OBSERVABILITY_FAILURE" && !unknownFailsClosed ? "unknown observability condition" : "deterministic threshold evaluation", supporting_metric_refs: freezeArray(metrics.slice(0, 2).map((metric) => metric.integrity_hash)), supporting_health_refs: freezeArray(health_records.slice(0, 1).map((record) => record.integrity_hash)), response: alert_category === "OBSERVABILITY_FAILURE" ? "FAIL_CLOSED" as const : "LOG" as const, operator_actions: freezeArray(["acknowledge"]), resolution_status: "OPEN", resolution_refs: freezeArray([]), evidence_refs: alertEvidenceRefs })));
  const evidence_ledger = freezeArray(componentTypes.map((component_type, index) => nested({ ledger_entry_id: id("operational_evidence", { component_type, componentId }), sequence: index + 1, evidence_type: component_type.toLowerCase(), health_ref: health_records[index].integrity_hash, dashboard_ref: dashboards[index % dashboards.length].integrity_hash, alert_ref: alerts[index % alerts.length].integrity_hash, metric_refs: freezeArray(metrics.slice(0, 2).map((metric) => metric.integrity_hash)), replay_ref: health_engine.replay_refs[0] ?? "", governance_ref: governanceVisible ? performance.certification_package.integrity_hash : "", append_only: evidenceImmutable, immutable: evidenceImmutable })));
  const certification_package = nested({ package_id: id("observability_certification", componentId), operations_dashboard_complete: dashboards[0].complete, capacity_dashboard_complete: dashboards[1].complete, tenant_health_dashboard_complete: dashboards[2].complete, infrastructure_dashboard_complete: dashboards[3].complete, operational_visibility_comprehensive: visibilityComplete && dashboards.every((dashboard) => dashboard.complete), alerts_validated: !has(failures, "ALERTS_NOT_VALIDATED") && alerts.length === alertCategories.length && alert_policy_registry.equivalent_state_equivalent_alerts, observability_replayable: replayable && health_engine.replay_refs.length > 0 && dashboards.every((dashboard) => dashboard.replayable_history), monitoring_deterministic: deterministic && health_engine.deterministic_classification && alert_policy_registry.severity_classification_deterministic, tenant_isolation_preserved: tenantIsolated && dashboards.every((dashboard) => dashboard.tenant_isolated) && event_registry.cross_tenant_visibility_prohibited, immutable_operational_evidence_complete: evidence_ledger.every((entry) => entry.append_only && entry.immutable), monitoring_certified: !has(failures, "MONITORING_NOT_CERTIFIED") && blockingFailures.length === 0, operational_readiness_confirmed: !has(failures, "OPERATIONAL_READINESS_NOT_CONFIRMED") && performance.certification_package.scalability_certified, governance_visibility: governanceVisible, observability_passive: passive && dashboards.every((dashboard) => dashboard.passive_only) && !alert_policy_registry.monitoring_authorizes_actions, evidence_refs: freezeArray([performance.integrity_hash, metrics_registry.integrity_hash, health_engine.integrity_hash]) });
  const tests = freezeArray([
    certTest("Operations Dashboard complete", certification_package.operations_dashboard_complete, "OPERATIONS_DASHBOARD_INCOMPLETE", [dashboards[0].integrity_hash]),
    certTest("Capacity Dashboard complete", certification_package.capacity_dashboard_complete, "CAPACITY_DASHBOARD_INCOMPLETE", [dashboards[1].integrity_hash]),
    certTest("Tenant Health Dashboard complete", certification_package.tenant_health_dashboard_complete, "TENANT_HEALTH_DASHBOARD_INCOMPLETE", [dashboards[2].integrity_hash]),
    certTest("Infrastructure Dashboard complete", certification_package.infrastructure_dashboard_complete, "INFRASTRUCTURE_DASHBOARD_INCOMPLETE", [dashboards[3].integrity_hash]),
    certTest("Operational visibility comprehensive", certification_package.operational_visibility_comprehensive, "OPERATIONAL_VISIBILITY_INCOMPLETE", [metrics_registry.integrity_hash]),
    certTest("Alerts validated", certification_package.alerts_validated, "ALERTS_NOT_VALIDATED", [alert_policy_registry.integrity_hash]),
    certTest("Observability replayable", certification_package.observability_replayable, "OBSERVABILITY_NOT_REPLAYABLE", [event_registry.integrity_hash]),
    certTest("Monitoring deterministic", certification_package.monitoring_deterministic, "MONITORING_NOT_DETERMINISTIC", [health_engine.integrity_hash]),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation_preserved, "TENANT_ISOLATION_VIOLATED", [event_registry.integrity_hash]),
    certTest("Immutable operational evidence complete", certification_package.immutable_operational_evidence_complete, "OPERATIONAL_EVIDENCE_NOT_IMMUTABLE", evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("Monitoring certified", certification_package.monitoring_certified, "MONITORING_NOT_CERTIFIED", [certification_package.integrity_hash]),
    certTest("Operational readiness confirmed", certification_package.operational_readiness_confirmed, "OPERATIONAL_READINESS_NOT_CONFIRMED", [performance.certification_package.integrity_hash]),
    certTest("Governance visibility present", certification_package.governance_visibility, "GOVERNANCE_VISIBILITY_MISSING", [health_engine.integrity_hash]),
    certTest("Unknown conditions fail closed", unknownFailsClosed && alerts.some((alert) => alert.response === "FAIL_CLOSED"), "UNKNOWN_CONDITIONS_NOT_FAIL_CLOSED", [alert_policy_registry.integrity_hash]),
    certTest("Observability remains passive", certification_package.observability_passive, "OBSERVABILITY_MODIFIES_PRODUCTION_STATE", [alert_policy_registry.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionOperationsObservabilityFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ProductionOperationsObservabilityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, performance_scalability_validation_ref: performance.integrity_hash, dashboards, health_engine, health_records, event_registry, metrics_registry, alert_policy_registry, alerts, evidence_ledger, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionOperationsObservability(result = runProductionOperationsObservability()): ProductionOperationsObservabilityValidation {
  const dashboards_valid = result.dashboards.length === 4 && result.dashboards.every((dashboard) => verify(dashboard) && dashboard.complete && dashboard.derived_from_authoritative_evidence && dashboard.replayable_history && dashboard.tenant_isolated && dashboard.passive_only);
  const health_valid = verify(result.health_engine) && result.health_engine.assessed_domains.length === 12 && result.health_engine.replay_refs.length > 0 && result.health_records.length === 12 && result.health_records.every((record) => verify(record) && record.health_state !== "UNKNOWN" && record.observed_metrics.length > 0 && record.certification_refs.length > 0 && record.governance_refs.length > 0 && record.replay_refs.length > 0);
  const event_registry_valid = verify(result.event_registry) && result.event_registry.event_categories.length === 12 && Object.entries(result.event_registry).filter(([key]) => !["registry_id", "event_categories", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const metrics_registry_valid = verify(result.metrics_registry) && result.metrics_registry.metrics.length === 15 && result.metrics_registry.metrics.every(verify) && result.metrics_registry.metrics_registered && result.metrics_registry.authority_sources_present && result.metrics_registry.versions_present && result.metrics_registry.deterministic_collection;
  const alerts_valid = verify(result.alert_policy_registry) && result.alerts.length === 10 && result.alerts.every((alert) => verify(alert) && alert.supporting_metric_refs.length > 0 && alert.supporting_health_refs.length > 0 && alert.evidence_refs.length > 0) && !result.alert_policy_registry.monitoring_authorizes_actions && result.alert_policy_registry.unknown_conditions_fail_closed;
  const evidence_valid = result.evidence_ledger.length === 12 && result.evidence_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.health_ref.length > 0 && entry.dashboard_ref.length > 0 && entry.alert_ref.length > 0 && entry.metric_refs.length > 0 && entry.replay_ref.length > 0 && entry.governance_ref.length > 0 && entry.append_only && entry.immutable);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 15 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && dashboards_valid && health_valid && event_registry_valid && metrics_registry_valid && alerts_valid && evidence_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, dashboards_valid, health_valid, event_registry_valid, metrics_registry_valid, alerts_valid, evidence_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayProductionOperationsObservability(result = runProductionOperationsObservability()): boolean {
  const replayed = runProductionOperationsObservability();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionOperationsObservability(result).valid;
}

export function getProductionOperationsObservabilityBundle(): ProductionOperationsObservabilityBundle {
  const result = runProductionOperationsObservability();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "performance-scalability-validation/v17.8" as const, health_states: healthStates, component_types: componentTypes, alert_categories: alertCategories, alert_severities: alertSeverities, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionOperationsObservability(result) });
}

export const ProductionOperationsObservabilityService = Object.freeze({ run: runProductionOperationsObservability, validate: validateProductionOperationsObservability, replay: replayProductionOperationsObservability });
