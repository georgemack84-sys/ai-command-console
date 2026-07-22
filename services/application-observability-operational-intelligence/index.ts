import { runApplicationReplayAuditForensics, validateApplicationReplayAuditForensics } from "@/services/application-replay-audit-forensics";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationOperationalBundle,
  ApplicationOperationalFailure,
  ApplicationOperationalInput,
  ApplicationOperationalIntelligenceResult,
  ApplicationOperationalOutcome,
  ApplicationOperationalScenario,
  ApplicationOperationalValidation,
  DiagnosticRecord,
} from "@/types/application-observability-operational-intelligence";

const VERSION = "application-observability-operational-intelligence/v4.10" as const;
const IDENTIFIER = "ApplicationObservabilityOperationalIntelligence" as const;
const TIMESTAMP = "2026-07-18T00:00:00.000Z" as const;
let baselineReplayAuditForensics: ReturnType<typeof runApplicationReplayAuditForensics> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function has(failures: readonly ApplicationOperationalFailure[], failure: ApplicationOperationalFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationOperationalScenario): ApplicationOperationalFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function getBaselineReplayAuditForensics() { baselineReplayAuditForensics ??= runApplicationReplayAuditForensics(); return baselineReplayAuditForensics; }
function outcome(failures: readonly ApplicationOperationalFailure[]): ApplicationOperationalOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<ApplicationOperationalIntelligenceResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    dashboards: result.dashboards.map((dashboard) => dashboard.integrity_hash),
    intelligence: result.operational_intelligence.integrity_hash,
    diagnostics: result.diagnostics.map((diagnostic) => diagnostic.integrity_hash),
    telemetry: result.telemetry_view.integrity_hash,
    health: result.health_intelligence.integrity_hash,
    alerts: result.alert_view.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationOperationalIntelligenceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationObservabilityOperationalIntelligence(input: ApplicationOperationalInput = {}): ApplicationOperationalIntelligenceResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationOperationalFailure>(direct ? [direct] : []);
  const replayForensics = getBaselineReplayAuditForensics();
  const dependencyFailures = freezeArray<ApplicationOperationalFailure>([
    ...(!validateApplicationReplayAuditForensics(replayForensics).valid || has(scenarioFailures, "P4_9_REPLAY_AUDIT_FORENSICS_INVALID") ? ["P4_9_REPLAY_AUDIT_FORENSICS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_OBSERVABILITY_INFRASTRUCTURE_INVALID") ? ["CCI_OBSERVABILITY_INFRASTRUCTURE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_METRICS_INVALID") ? ["CCI_METRICS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_LOGS_INVALID") ? ["CCI_LOGS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_TRACES_INVALID") ? ["CCI_TRACES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_MONITORING_SERVICES_INVALID") ? ["CCI_MONITORING_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_AGENT_TELEMETRY_INVALID") ? ["CAF_AGENT_TELEMETRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_RUNTIME_TELEMETRY_INVALID") ? ["CAF_RUNTIME_TELEMETRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_OPERATIONAL_EVENTS_INVALID") ? ["CAF_OPERATIONAL_EVENTS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_HEALTH_SIGNALS_INVALID") ? ["CAF_HEALTH_SIGNALS_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_EXECUTION_SUMMARIES_INVALID") ? ["CAF_EXECUTION_SUMMARIES_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = input.application_id ?? replayForensics.replay_request.application_id;
  const tenantId = input.tenant_id ?? "tenant:qualified:primary";
  const dashboards = freezeArray([
    nested({
      dashboard_id: has(failures, "APPLICATION_DASHBOARD_MISSING") ? "" : "P4.10-DASHBOARD-APPLICATION-001",
      application_id: applicationId,
      tenant_id: tenantId,
      dashboard_name: "Application Operational View",
      dashboard_type: "APPLICATION" as const,
      layout_version: "p4.10-layout/v1",
      widget_refs: has(failures, "DASHBOARD_FRAMEWORK_MISSING") ? freezeArray<string>([]) : freezeArray(["widget:health-score", "widget:telemetry-summary", "widget:diagnostics"]),
      visibility_scope: freezeArray(["application-operator", "tenant-operator"]),
      generated_timestamp: TIMESTAMP,
      governed: !has(failures, "DASHBOARD_GOVERNANCE_MISSING"),
    }),
    nested({
      dashboard_id: has(failures, "EXECUTIVE_DASHBOARD_MISSING") ? "" : "P4.10-DASHBOARD-EXECUTIVE-001",
      application_id: applicationId,
      tenant_id: tenantId,
      dashboard_name: "Executive Operational View",
      dashboard_type: "EXECUTIVE" as const,
      layout_version: "p4.10-layout/v1",
      widget_refs: freezeArray(["widget:availability", "widget:trend-summary", "widget:recommendations"]),
      visibility_scope: freezeArray(["executive", "program-governance"]),
      generated_timestamp: TIMESTAMP,
      governed: !has(failures, "DASHBOARD_GOVERNANCE_MISSING"),
    }),
    nested({
      dashboard_id: has(failures, "TENANT_DASHBOARD_MISSING") || has(failures, "TENANT_OPERATIONAL_VIEW_INCOMPLETE") ? "" : "P4.10-DASHBOARD-TENANT-001",
      application_id: applicationId,
      tenant_id: tenantId,
      dashboard_name: "Tenant Operational View",
      dashboard_type: "TENANT" as const,
      layout_version: "p4.10-layout/v1",
      widget_refs: freezeArray(["widget:tenant-health", "widget:dependency-status", "widget:tenant-alerts"]),
      visibility_scope: freezeArray(["tenant-operator"]),
      generated_timestamp: TIMESTAMP,
      governed: !has(failures, "DASHBOARD_GOVERNANCE_MISSING"),
    }),
    nested({
      dashboard_id: "P4.10-DASHBOARD-HEALTH-001",
      application_id: applicationId,
      tenant_id: tenantId,
      dashboard_name: "Health and Diagnostics View",
      dashboard_type: "HEALTH" as const,
      layout_version: "p4.10-layout/v1",
      widget_refs: freezeArray(["widget:runtime-stability", "widget:capability-health", "widget:interface-health"]),
      visibility_scope: freezeArray(["operations", "application-operator"]),
      generated_timestamp: TIMESTAMP,
      governed: !has(failures, "DASHBOARD_GOVERNANCE_MISSING"),
    }),
  ]);
  const telemetrySources = has(failures, "TELEMETRY_VIEW_MISSING") ? freezeArray<string>([]) : freezeArray(["cci:metrics", "cci:logs", "cci:traces", "caf:agent-telemetry", "caf:runtime-telemetry", "caf:health-signals"]);
  const telemetry_view = nested({
    view_id: has(failures, "TELEMETRY_VIEW_MISSING") ? "" : "P4.10-TELEMETRY-VIEW-001",
    application_id: applicationId,
    tenant_id: tenantId,
    telemetry_sources: telemetrySources,
    metrics_refs: freezeArray(["cci:metric:availability", "cci:metric:latency", "cci:metric:error-rate"]),
    trace_refs: freezeArray(["cci:trace:integration-path", "cci:trace:capability-path"]),
    log_refs: freezeArray(["cci:log:application-events", "cci:log:operator-events"]),
    health_summary: "Authoritative CCI and CAF telemetry is aggregated into application health views.",
    generated_timestamp: TIMESTAMP,
    aggregation_valid: !has(failures, "TELEMETRY_AGGREGATION_INVALID"),
    consumes_only_authoritative_sources: true,
  });
  const operational_intelligence = nested({
    intelligence_id: has(failures, "OPERATIONAL_INTELLIGENCE_MISSING") ? "" : "P4.10-OPERATIONAL-INTELLIGENCE-001",
    application_id: applicationId,
    tenant_id: tenantId,
    summary: "Application is available with monitored dependency and capability health.",
    health_assessment: "Operational signals indicate stable application behavior with no critical findings.",
    availability_status: "AVAILABLE" as const,
    operational_findings: freezeArray(["application-availability-visible", "dependency-health-visible", "runtime-stability-visible"]),
    recommendations: freezeArray(["continue-monitoring", "review-warning-summaries-daily"]),
    anomaly_interpretation_refs: has(failures, "ANOMALY_INTERPRETATION_MISSING") ? freezeArray<string>([]) : freezeArray(["interpretation:anomaly:p4.10"]),
    trend_analysis_refs: has(failures, "TREND_ANALYSIS_MISSING") || has(failures, "OPERATIONAL_TRENDS_NOT_VISIBLE") ? freezeArray<string>([]) : freezeArray(["trend:availability:p4.10", "trend:latency:p4.10"]),
    generated_timestamp: TIMESTAMP,
  });
  const diagnostics = freezeArray<DiagnosticRecord>([
    nested({
      diagnostic_id: has(failures, "DIAGNOSTICS_FRAMEWORK_MISSING") ? "" : "P4.10-DIAGNOSTIC-RUNTIME-001",
      application_id: applicationId,
      diagnostic_type: "Runtime Diagnostics",
      severity: "INFO" as const,
      diagnostic_summary: "Runtime health interpreted from CAF runtime telemetry and CCI traces.",
      affected_components: freezeArray(["application-runtime"]),
      dependency_refs: freezeArray(["caf:runtime-telemetry", "cci:trace:runtime"]),
      recommended_actions: freezeArray(["maintain-baseline"]),
      generated_timestamp: TIMESTAMP,
    }),
    nested({
      diagnostic_id: has(failures, "DEPENDENCY_DIAGNOSTICS_MISSING") ? "" : "P4.10-DIAGNOSTIC-DEPENDENCY-001",
      application_id: applicationId,
      diagnostic_type: "Dependency Diagnostics",
      severity: "INFO" as const,
      diagnostic_summary: "Dependency health is interpreted from integration traces and monitoring services.",
      affected_components: freezeArray(["integration-contract", "platform-dependency"]),
      dependency_refs: freezeArray(["cci:monitoring", "p4.6:integration-contract"]),
      recommended_actions: freezeArray(["review-dependency-trends"]),
      generated_timestamp: TIMESTAMP,
    }),
    nested({
      diagnostic_id: has(failures, "CAPABILITY_DIAGNOSTICS_MISSING") || has(failures, "INTERFACE_DIAGNOSTICS_MISSING") ? "" : "P4.10-DIAGNOSTIC-CAPABILITY-001",
      application_id: applicationId,
      diagnostic_type: "Capability and Interface Diagnostics",
      severity: "INFO" as const,
      diagnostic_summary: "Capability and interface health are interpreted from application telemetry views.",
      affected_components: freezeArray(["capability-execution", "application-interface"]),
      dependency_refs: freezeArray(["p4.3:capability-map", "p4.6:interface-contract"]),
      recommended_actions: freezeArray(["keep-interface-health-visible"]),
      generated_timestamp: TIMESTAMP,
    }),
  ]);
  const health_intelligence = nested({
    health_id: has(failures, "HEALTH_INTELLIGENCE_MISSING") ? "" : "P4.10-HEALTH-INTELLIGENCE-001",
    application_id: applicationId,
    dependency_health_refs: has(failures, "DEPENDENCY_HEALTH_NOT_VISIBLE") ? freezeArray<string>([]) : freezeArray(["health:dependency:integration", "health:dependency:platform"]),
    operational_score: has(failures, "APPLICATION_HEALTH_NOT_MEASURABLE") ? 0 : 98,
    availability_status: "AVAILABLE" as const,
    runtime_stability_summary: "Runtime stability is measurable from CAF health signals and CCI traces.",
    capability_health_refs: freezeArray(["health:capability:execution", "health:capability:governance"]),
    interface_health_refs: freezeArray(["health:interface:api", "health:interface:tenant"]),
    measurable: !has(failures, "APPLICATION_HEALTH_NOT_MEASURABLE"),
  });
  const alert_view = nested({
    alert_view_id: has(failures, "OPERATIONAL_ALERT_VIEW_MISSING") ? "" : "P4.10-OPERATIONAL-ALERT-VIEW-001",
    application_id: applicationId,
    warning_summary_refs: freezeArray(["caf:warning-summary:p4.10", "cci:monitoring-warning:p4.10"]),
    operational_notification_refs: freezeArray(["notification:view:operations", "notification:view:tenant"]),
    dashboard_alert_refs: freezeArray(["dashboard-alert:health", "dashboard-alert:dependency"]),
    visualizes_alerts: !has(failures, "OPERATIONAL_ALERT_VIEW_MISSING"),
    generates_alerts: has(failures, "ALERT_GENERATION_ATTEMPTED"),
  });
  const noOutOfScope = !has(failures, "TELEMETRY_COLLECTION_ATTEMPTED") && !has(failures, "METRICS_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "TRACING_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "LOG_STORAGE_ATTEMPTED") && !has(failures, "RUNTIME_MONITORING_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "AGENT_TELEMETRY_GENERATION_ATTEMPTED") && !has(failures, "REPLAY_OWNERSHIP_ATTEMPTED") && !has(failures, "FORENSIC_EVIDENCE_OWNERSHIP_ATTEMPTED") && !has(failures, "ALERT_GENERATION_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(dashboards.some((dashboard) => dashboard.widget_refs.length === 0) ? ["DASHBOARD_FRAMEWORK_MISSING" as const] : []),
    ...(dashboards.some((dashboard) => dashboard.dashboard_type === "APPLICATION" && dashboard.dashboard_id.length === 0) ? ["APPLICATION_DASHBOARD_MISSING" as const] : []),
    ...(dashboards.some((dashboard) => dashboard.dashboard_type === "EXECUTIVE" && dashboard.dashboard_id.length === 0) ? ["EXECUTIVE_DASHBOARD_MISSING" as const] : []),
    ...(dashboards.some((dashboard) => dashboard.dashboard_type === "TENANT" && dashboard.dashboard_id.length === 0) ? ["TENANT_DASHBOARD_MISSING" as const] : []),
    ...(dashboards.some((dashboard) => !dashboard.governed) ? ["DASHBOARD_GOVERNANCE_MISSING" as const] : []),
    ...(operational_intelligence.intelligence_id.length === 0 ? ["OPERATIONAL_INTELLIGENCE_MISSING" as const] : []),
    ...(operational_intelligence.anomaly_interpretation_refs.length === 0 ? ["ANOMALY_INTERPRETATION_MISSING" as const] : []),
    ...(operational_intelligence.trend_analysis_refs.length === 0 ? ["TREND_ANALYSIS_MISSING" as const] : []),
    ...(diagnostics.some((diagnostic) => diagnostic.diagnostic_id.length === 0) ? ["DIAGNOSTICS_FRAMEWORK_MISSING" as const] : []),
    ...(diagnostics.some((diagnostic) => diagnostic.diagnostic_type === "Dependency Diagnostics" && diagnostic.diagnostic_id.length === 0) ? ["DEPENDENCY_DIAGNOSTICS_MISSING" as const] : []),
    ...(diagnostics.some((diagnostic) => diagnostic.diagnostic_type === "Capability and Interface Diagnostics" && diagnostic.diagnostic_id.length === 0) ? ["CAPABILITY_DIAGNOSTICS_MISSING" as const] : []),
    ...(telemetry_view.view_id.length === 0 ? ["TELEMETRY_VIEW_MISSING" as const] : []),
    ...(!telemetry_view.aggregation_valid ? ["TELEMETRY_AGGREGATION_INVALID" as const] : []),
    ...(health_intelligence.health_id.length === 0 ? ["HEALTH_INTELLIGENCE_MISSING" as const] : []),
    ...(health_intelligence.dependency_health_refs.length === 0 ? ["DEPENDENCY_HEALTH_NOT_VISIBLE" as const] : []),
    ...(!health_intelligence.measurable ? ["APPLICATION_HEALTH_NOT_MEASURABLE" as const] : []),
    ...(alert_view.alert_view_id.length === 0 ? ["OPERATIONAL_ALERT_VIEW_MISSING" as const] : []),
    ...(operational_intelligence.trend_analysis_refs.length === 0 ? ["OPERATIONAL_TRENDS_NOT_VISIBLE" as const] : []),
    ...(dashboards.some((dashboard) => dashboard.dashboard_type === "TENANT" && dashboard.dashboard_id.length === 0) ? ["TENANT_OPERATIONAL_VIEW_INCOMPLETE" as const] : []),
    ...(!noOutOfScope ? ["TELEMETRY_COLLECTION_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.10-OPERATIONAL-INTELLIGENCE-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    dashboards_operational: dashboards.every((dashboard) => dashboard.dashboard_id.length > 0 && dashboard.widget_refs.length > 0),
    operational_intelligence_produced: operational_intelligence.intelligence_id.length > 0,
    diagnostics_complete: diagnostics.every((diagnostic) => diagnostic.diagnostic_id.length > 0),
    telemetry_views_available: telemetry_view.view_id.length > 0 && telemetry_view.aggregation_valid,
    dependency_health_visible: health_intelligence.dependency_health_refs.length > 0,
    application_health_measurable: health_intelligence.measurable && health_intelligence.operational_score > 0,
    executive_dashboards_available: dashboards.some((dashboard) => dashboard.dashboard_type === "EXECUTIVE" && dashboard.dashboard_id.length > 0),
    operational_trends_visible: operational_intelligence.trend_analysis_refs.length > 0,
    tenant_operational_views_complete: dashboards.some((dashboard) => dashboard.dashboard_type === "TENANT" && dashboard.dashboard_id.length > 0),
    dashboard_governance_implemented: dashboards.every((dashboard) => dashboard.governed),
    no_observability_infrastructure_ownership: !has(failures, "METRICS_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "TRACING_INFRASTRUCTURE_ATTEMPTED") && !has(failures, "LOG_STORAGE_ATTEMPTED") && !has(failures, "RUNTIME_MONITORING_INFRASTRUCTURE_ATTEMPTED"),
    no_telemetry_generation: !has(failures, "TELEMETRY_COLLECTION_ATTEMPTED") && !has(failures, "AGENT_TELEMETRY_GENERATION_ATTEMPTED"),
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationOperationalIntelligenceResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    replay_audit_forensics_ref: "application-replay-audit-forensics/v4.9",
    cci_observability_ref: "Program 2 - CCI Observability Infrastructure",
    caf_runtime_telemetry_ref: "Program 3 - CAF Runtime Telemetry",
    dashboards,
    operational_intelligence,
    diagnostics,
    telemetry_view,
    health_intelligence,
    alert_view,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationObservabilityOperationalIntelligence(result?: ApplicationOperationalIntelligenceResult): ApplicationOperationalValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, dashboards_valid: false, intelligence_valid: false, diagnostics_valid: false, telemetry_valid: false, health_valid: false, alerts_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const dashboards_valid = result.dashboards.length >= 4 && result.dashboards.every((dashboard) => verifyHashedRecord(dashboard) && dashboard.dashboard_id.length > 0 && dashboard.widget_refs.length > 0 && dashboard.governed);
  const intelligence_valid = verifyHashedRecord(result.operational_intelligence) && result.operational_intelligence.intelligence_id.length > 0 && result.operational_intelligence.anomaly_interpretation_refs.length > 0 && result.operational_intelligence.trend_analysis_refs.length > 0;
  const diagnostics_valid = result.diagnostics.length >= 3 && result.diagnostics.every((diagnostic) => verifyHashedRecord(diagnostic) && diagnostic.diagnostic_id.length > 0);
  const telemetry_valid = verifyHashedRecord(result.telemetry_view) && result.telemetry_view.view_id.length > 0 && result.telemetry_view.aggregation_valid && result.telemetry_view.consumes_only_authoritative_sources;
  const health_valid = verifyHashedRecord(result.health_intelligence) && result.health_intelligence.health_id.length > 0 && result.health_intelligence.measurable && result.health_intelligence.dependency_health_refs.length > 0;
  const alerts_valid = verifyHashedRecord(result.alert_view) && result.alert_view.alert_view_id.length > 0 && result.alert_view.visualizes_alerts && !result.alert_view.generates_alerts;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && dashboards_valid && intelligence_valid && diagnostics_valid && telemetry_valid && health_valid && alerts_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, dashboards_valid, intelligence_valid, diagnostics_valid, telemetry_valid, health_valid, alerts_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationObservabilityOperationalIntelligence(result = runApplicationObservabilityOperationalIntelligence()): boolean {
  const replayed = runApplicationObservabilityOperationalIntelligence();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationObservabilityOperationalIntelligence(result).valid;
}

export function getApplicationObservabilityOperationalIntelligenceBundle(): ApplicationOperationalBundle {
  const result = runApplicationObservabilityOperationalIntelligence();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_operational_visibility: true,
      owns_application_dashboards: true,
      owns_operational_intelligence: true,
      owns_application_diagnostics: true,
      owns_application_telemetry_views: true,
      owns_operational_health_interpretation: true,
      owns_telemetry_collection: false,
      owns_metrics_infrastructure: false,
      owns_tracing_infrastructure: false,
      owns_log_storage: false,
      owns_runtime_monitoring_infrastructure: false,
      generates_agent_runtime_telemetry: false,
    }),
    result,
    validation: validateApplicationObservabilityOperationalIntelligence(result),
  });
}

export const ApplicationObservabilityOperationalIntelligenceService = Object.freeze({
  run: runApplicationObservabilityOperationalIntelligence,
  validate: validateApplicationObservabilityOperationalIntelligence,
  replay: replayApplicationObservabilityOperationalIntelligence,
});
