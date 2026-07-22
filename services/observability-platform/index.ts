import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { runRegistryCore, validateRegistryCore } from "@/services/registry-core";
import type { ObservabilityPlatformBundle, ObservabilityPlatformDecision, ObservabilityPlatformFailure, ObservabilityPlatformInput, ObservabilityPlatformResult, ObservabilityPlatformScenario, ObservabilityPlatformValidation } from "@/types/observability-platform";

const VERSION = "observability-platform/w1.6" as const;
const IDENTIFIER = "ObservabilityPlatform" as const;
let registryBaseline: ReturnType<typeof runRegistryCore> | undefined;
let configurationBaseline: ReturnType<typeof runConfigurationPlatform> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ObservabilityPlatformFailure[], failure: ObservabilityPlatformFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: ObservabilityPlatformScenario): ObservabilityPlatformFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly ObservabilityPlatformFailure[], scenario: ObservabilityPlatformScenario): ObservabilityPlatformDecision {
  if (has(failures, "W1_4A_REGISTRY_CORE_INVALID") || has(failures, "W1_5_CONFIGURATION_PLATFORM_INVALID") || has(failures, "TENANT_AWARE_LOGGING_FAILED") || has(failures, "METRICS_INTEGRITY_FAILED") || has(failures, "TRACE_LINEAGE_INVALID") || has(failures, "TENANT_DASHBOARD_ISOLATION_FAILED") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "OBSERVABILITY_EVIDENCE_NOT_IMMUTABLE")) return "FAIL_CLOSED";
  if (has(failures, "OBSERVABILITY_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "QUALIFIED";
}
function resultReplayHash(result: Omit<ObservabilityPlatformResult, "replay_hash" | "integrity_hash">): string { return hash({ logging: result.logging.integrity_hash, metrics: result.metrics.integrity_hash, tracing: result.tracing.integrity_hash, health: result.health.integrity_hash, alerting: result.alerting.integrity_hash, dashboards: result.dashboards.integrity_hash, diagnostics: result.diagnostics.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<ObservabilityPlatformResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runObservabilityPlatform(input: ObservabilityPlatformInput = {}): ObservabilityPlatformResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ObservabilityPlatformFailure>(direct ? [direct] : []);
  registryBaseline ??= runRegistryCore();
  configurationBaseline ??= runConfigurationPlatform();
  const registryInvalid = !validateRegistryCore(registryBaseline).valid || has(scenarioFailures, "W1_4A_REGISTRY_CORE_INVALID");
  const configurationInvalid = !validateConfigurationPlatform(configurationBaseline).valid || has(scenarioFailures, "W1_5_CONFIGURATION_PLATFORM_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(registryInvalid ? ["W1_4A_REGISTRY_CORE_INVALID" as const] : []), ...(configurationInvalid ? ["W1_5_CONFIGURATION_PLATFORM_INVALID" as const] : [])])]);
  const registryOk = !registryInvalid;
  const configurationOk = !configurationInvalid;
  const loggingOk = !has(failures, "LOGGING_FOUNDATION_MISSING") && !has(failures, "STRUCTURED_LOG_SCHEMA_INVALID") && !has(failures, "CORRELATION_IDS_MISSING") && !has(failures, "TENANT_AWARE_LOGGING_FAILED");
  const metricsOk = !has(failures, "METRICS_PLATFORM_MISSING") && !has(failures, "METRICS_REGISTRY_MISSING") && !has(failures, "METRICS_INTEGRITY_FAILED");
  const tracingOk = !has(failures, "DISTRIBUTED_TRACING_MISSING") && !has(failures, "TRACE_CORRELATION_FAILED") && !has(failures, "TRACE_LINEAGE_INVALID");
  const healthOk = !has(failures, "HEALTH_MONITORING_MISSING") && !has(failures, "READINESS_CHECKS_FAILED") && !has(failures, "DEPENDENCY_HEALTH_MISSING");
  const alertingOk = !has(failures, "ALERTING_MISSING") && !has(failures, "ALERT_GENERATION_NON_DETERMINISTIC") && !has(failures, "ESCALATION_POLICIES_MISSING");
  const dashboardsOk = !has(failures, "DASHBOARDS_MISSING") && !has(failures, "DASHBOARD_ACCURACY_FAILED") && !has(failures, "TENANT_DASHBOARD_ISOLATION_FAILED");
  const diagnosticsOk = !has(failures, "DIAGNOSTICS_MISSING") && !has(failures, "DIAGNOSTIC_NON_DETERMINISTIC") && !has(failures, "FAILURE_CORRELATION_FAILED");
  const evidenceOk = !has(failures, "OBSERVABILITY_EVIDENCE_MISSING") && !has(failures, "OBSERVABILITY_EVIDENCE_NOT_IMMUTABLE");
  const operationalOk = !has(failures, "OPERATIONAL_READINESS_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "QUALIFIED";
  const logging = nested({ platform_id: loggingOk ? `platform:w1.6:logging:${input.seed ?? "canonical"}` : "", structured_schema: loggingOk, pipeline: loggingOk, collectors: loggingOk, validation: loggingOk, correlation_ids: loggingOk, request_ids: loggingOk, tenant_aware: loggingOk, immutable_log_events: loggingOk });
  const metrics = nested({ platform_id: metricsOk ? "platform:w1.6:metrics" : "", metrics_registry: metricsOk, platform_metrics: metricsOk, service_metrics: metricsOk, resource_metrics: metricsOk, performance_metrics: metricsOk, custom_metrics: metricsOk, tenant_metrics: metricsOk, capacity_metrics: metricsOk });
  const tracing = nested({ platform_id: tracingOk ? "platform:w1.6:tracing" : "", trace_registry: tracingOk, end_to_end_traces: tracingOk, span_collection: tracingOk, dependency_tracing: tracingOk, service_flow_mapping: tracingOk, correlation_validation: tracingOk, trace_lineage: tracingOk });
  const health = nested({ platform_id: healthOk ? "platform:w1.6:health" : "", health_registry: healthOk, liveness_checks: healthOk, readiness_checks: healthOk, dependency_health: healthOk, service_health: healthOk, platform_health: healthOk, resource_health: healthOk, tenant_health: healthOk });
  const alerting = nested({ platform_id: alertingOk ? "platform:w1.6:alerting" : "", alert_registry: alertingOk, threshold_alerts: alertingOk, dependency_alerts: alertingOk, availability_alerts: alertingOk, capacity_alerts: alertingOk, health_alerts: alertingOk, configuration_alerts: alertingOk, security_alerts: alertingOk, deterministic_generation: alertingOk });
  const dashboards = nested({ platform_id: dashboardsOk ? "platform:w1.6:dashboards" : "", dashboard_catalog: dashboardsOk, platform_dashboard: dashboardsOk, service_dashboard: dashboardsOk, registry_dashboard: dashboardsOk, configuration_dashboard: dashboardsOk, infrastructure_dashboard: dashboardsOk, tenant_dashboard: dashboardsOk, executive_dashboard: dashboardsOk, accuracy_validated: dashboardsOk });
  const diagnostics = nested({ platform_id: diagnosticsOk ? "platform:w1.6:diagnostics" : "", diagnostic_engine: diagnosticsOk, correlation_engine: diagnosticsOk, root_cause_analysis: diagnosticsOk, failure_correlation: diagnosticsOk, event_correlation: diagnosticsOk, dependency_diagnostics: diagnosticsOk, configuration_diagnostics: diagnosticsOk, performance_diagnostics: diagnosticsOk, deterministic: diagnosticsOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w1.6:observability-evidence" : "", records: evidenceOk ? freezeArray(["evidence:logging", "evidence:metrics", "evidence:tracing", "evidence:health", "evidence:alerting", "evidence:dashboards", "evidence:diagnostics", "evidence:qualification"]) : freezeArray<string>([]), logging_evidence: evidenceOk, metrics_evidence: evidenceOk, trace_evidence: evidenceOk, health_evidence: evidenceOk, alert_evidence: evidenceOk, dashboard_evidence: evidenceOk, diagnostic_evidence: evidenceOk, qualification_evidence: evidenceOk, immutable: evidenceOk });
  const qualification = nested({ report_id: operationalOk ? "report:w1.6:observability-qualification" : "", structured_telemetry: qualified, metrics_integrity: qualified, trace_lineage: qualified, health_monitoring: qualified, alert_generation: qualified, dashboard_accuracy: qualified, diagnostic_determinism: qualified, tenant_isolation: qualified, evidence_integrity: qualified, qualified });
  const readiness = nested({ readiness_id: "W1.6-OBSERVABILITY-PLATFORM-READINESS-001", decision, phase_ready: qualified, registry_core_ready: registryOk, configuration_platform_ready: configurationOk, logging_ready: loggingOk, metrics_ready: metricsOk, tracing_ready: tracingOk, health_ready: healthOk, alerting_ready: alertingOk, dashboards_ready: dashboardsOk, diagnostics_ready: diagnosticsOk, evidence_ready: evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<ObservabilityPlatformResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, registry_core_ref: "registry-core/w1.4a", configuration_platform_ref: "configuration-platform/w1.5", logging, metrics, tracing, health, alerting, dashboards, diagnostics, evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateObservabilityPlatform(result?: ObservabilityPlatformResult): ObservabilityPlatformValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, logging_valid: false, metrics_valid: false, tracing_valid: false, health_valid: false, alerting_valid: false, dashboards_valid: false, diagnostics_valid: false, evidence_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["LOGGING_FOUNDATION_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const logging_valid = verifyHashed(result.logging) && result.logging.structured_schema && result.logging.correlation_ids && result.logging.tenant_aware;
  const metrics_valid = verifyHashed(result.metrics) && result.metrics.metrics_registry && result.metrics.service_metrics && result.metrics.tenant_metrics;
  const tracing_valid = verifyHashed(result.tracing) && result.tracing.trace_registry && result.tracing.correlation_validation && result.tracing.trace_lineage;
  const health_valid = verifyHashed(result.health) && result.health.liveness_checks && result.health.readiness_checks && result.health.dependency_health;
  const alerting_valid = verifyHashed(result.alerting) && result.alerting.alert_registry && result.alerting.configuration_alerts && result.alerting.deterministic_generation;
  const dashboards_valid = verifyHashed(result.dashboards) && result.dashboards.dashboard_catalog && result.dashboards.tenant_dashboard && result.dashboards.accuracy_validated;
  const diagnostics_valid = verifyHashed(result.diagnostics) && result.diagnostics.diagnostic_engine && result.diagnostics.failure_correlation && result.diagnostics.deterministic;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.qualification_evidence;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.structured_telemetry && result.qualification.tenant_isolation && result.qualification.qualified;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && logging_valid && metrics_valid && tracing_valid && health_valid && alerting_valid && dashboards_valid && diagnostics_valid && evidence_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, logging_valid, metrics_valid, tracing_valid, health_valid, alerting_valid, dashboards_valid, diagnostics_valid, evidence_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayObservabilityPlatform(result = runObservabilityPlatform()): boolean { const replayed = runObservabilityPlatform(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateObservabilityPlatform(result).valid; }
export function getObservabilityPlatformBundle(): ObservabilityPlatformBundle { const result = runObservabilityPlatform(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_logging: true, owns_metrics: true, owns_distributed_tracing: true, owns_health_monitoring: true, owns_alerting: true, owns_operational_dashboards: true, owns_diagnostics: true, owns_observability_evidence: true, exit_state: "QUALIFIED" }), result, validation: validateObservabilityPlatform(result) }); }
export const ObservabilityPlatformService = Object.freeze({ run: runObservabilityPlatform, validate: validateObservabilityPlatform, replay: replayObservabilityPlatform });
