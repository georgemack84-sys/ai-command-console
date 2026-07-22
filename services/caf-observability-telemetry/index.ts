import { runAgentIdentityLifecycle, validateAgentIdentityLifecycle } from "@/services/caf-agent-identity-lifecycle";
import { runCollaborationFederation, validateCollaborationFederation } from "@/services/caf-collaboration-federation";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runHumanOperatorInteraction, validateHumanOperatorInteraction } from "@/services/caf-human-operator-interaction";
import { runMemoryKnowledge, validateMemoryKnowledge } from "@/services/caf-memory-knowledge";
import { runPlanningReasoning, validatePlanningReasoning } from "@/services/caf-planning-reasoning";
import { runRuntimeOrchestration, validateRuntimeOrchestration } from "@/services/caf-runtime-orchestration";
import { runSafetyBehavioralConstraints, validateSafetyBehavioralConstraints } from "@/services/caf-safety-behavioral-constraints";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AgentMetricRecord,
  AgentTelemetryRecord,
  AgentTraceRecord,
  AlertRecord,
  DashboardDefinition,
  DiagnosticRecord,
  HealthRecord,
  ObservabilityCertificationOutcome,
  ObservabilityTelemetryBundle,
  ObservabilityTelemetryFailure,
  ObservabilityTelemetryInput,
  ObservabilityTelemetryResult,
  ObservabilityTelemetryScenario,
  ObservabilityTelemetryValidation,
} from "@/types/caf-observability-telemetry";

const VERSION = "caf-observability-telemetry/v3.10" as const;
const IDENTIFIER = "CafObservabilityTelemetry" as const;

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
function scenarioFailure(scenario: ObservabilityTelemetryScenario): ObservabilityTelemetryFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly ObservabilityTelemetryFailure[], failure: ObservabilityTelemetryFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly ObservabilityTelemetryFailure[]): ObservabilityCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function buildTelemetry(failures: readonly ObservabilityTelemetryFailure[]): readonly AgentTelemetryRecord[] {
  const sources = [
    ["lifecycle", "P3.1 Agent Registry", "ACTIVE"],
    ["execution", "P3.3 Runtime Orchestrator", "RUNNING"],
    ["memory", "P3.4 Memory Engine", "GOVERNED"],
    ["planning", "P3.5 Planning Engine", "PLANNING"],
    ["collaboration", "P3.6 Collaboration Framework", "FEDERATED"],
    ["governance", "P3.7 Governance Services", "ADMITTED"],
    ["safety", "P3.8 Safety Engine", "SAFE_WITH_WARNINGS"],
    ["operator", "P3.9 Interaction Framework", "AUTHORIZED"],
  ] as const;
  const records = sources.map(([eventType, source, lifecycle], index) => nested({
    telemetry_id: `P3.10-TELEMETRY-${String(index + 1).padStart(3, "0")}`,
    timestamp: `2026-07-17T00:${String(index).padStart(2, "0")}:00.000Z`,
    agent_id: "agent:p3.10:observed",
    execution_id: "execution:p3.10:001",
    event_type: eventType,
    event_source: source,
    lifecycle_state: lifecycle,
    severity: "INFO" as const,
    payload_reference: `payload:p3.10:${eventType}`,
    correlation_id: "correlation:p3.10:001",
  }));
  return has(failures, "TELEMETRY_INCOMPLETE") ? freezeArray(records.slice(0, 6)) : freezeArray(records);
}

function buildTraces(failures: readonly ObservabilityTelemetryFailure[]): readonly AgentTraceRecord[] {
  const replayable = !has(failures, "TRACE_NOT_REPLAYABLE");
  const components = ["request-flow", "capability-execution", "planning-pipeline", "governance-evaluation", "safety-evaluation", "operator-interaction", "collaboration-routing", "execution-completion"];
  const traces = components.map((component, index) => nested({
    trace_id: "P3.10-TRACE-001",
    execution_id: "execution:p3.10:001",
    parent_span: index === 0 ? "" : `span-${String(index).padStart(2, "0")}`,
    span_id: `span-${String(index + 1).padStart(2, "0")}`,
    component,
    operation: `observe:${component}`,
    start_time: `2026-07-17T00:20:${String(index).padStart(2, "0")}.000Z`,
    end_time: `2026-07-17T00:20:${String(index).padStart(2, "0")}.250Z`,
    duration_ms: has(failures, "TRACE_NON_DETERMINISTIC") ? index + 1 : 250,
    status: "OK" as const,
    replayable,
  }));
  return freezeArray(traces);
}

function buildMetrics(failures: readonly ObservabilityTelemetryFailure[]): readonly AgentMetricRecord[] {
  const definitions = [
    ["active_agents", "AGENT", 1],
    ["execution_count", "EXECUTION", 12],
    ["planning_duration_ms", "PLANNING", 250],
    ["reasoning_latency_ms", "REASONING", 180],
    ["retrieval_latency_ms", "MEMORY", 40],
    ["approval_rate", "GOVERNANCE", 1],
    ["intervention_count", "SAFETY", 0],
    ["operator_approvals", "OPERATOR", 1],
    ["delegation_count", "COLLABORATION", 2],
  ] as const;
  const records = definitions.map(([name, category, value], index) => nested({
    metric_id: `P3.10-METRIC-${String(index + 1).padStart(3, "0")}`,
    timestamp: "2026-07-17T00:21:00.000Z",
    metric_name: name,
    metric_category: category,
    metric_value: value,
    aggregation_window: "PT1M",
    labels: Object.freeze({ tenant: "default", agent: "agent:p3.10:observed" }),
  }));
  return has(failures, "METRICS_INCOMPLETE") ? freezeArray(records.slice(0, 7)) : freezeArray(records);
}

function buildDiagnostics(failures: readonly ObservabilityTelemetryFailure[]): readonly DiagnosticRecord[] {
  const components = ["runtime", "planning", "reasoning", "governance", "safety", "memory", "collaboration", "operator"];
  const records = components.map((component, index) => nested({
    diagnostic_id: `P3.10-DIAGNOSTIC-${String(index + 1).padStart(3, "0")}`,
    timestamp: "2026-07-17T00:22:00.000Z",
    component,
    diagnostic_type: `${component}-diagnostic`,
    findings: freezeArray([`${component} diagnostics complete`]),
    severity: "INFO" as const,
    recommended_actions: freezeArray(["continue monitoring"]),
  }));
  return has(failures, "DIAGNOSTICS_INCOMPLETE") ? freezeArray(records.slice(0, 6)) : freezeArray(records);
}

function buildHealth(failures: readonly ObservabilityTelemetryFailure[], evidenceRefs: readonly string[]): readonly HealthRecord[] {
  const components = ["agent", "runtime", "dependency", "memory", "planning", "governance", "safety", "collaboration"];
  const records = components.map((component, index) => nested({
    health_id: `P3.10-HEALTH-${String(index + 1).padStart(3, "0")}`,
    timestamp: "2026-07-17T00:23:00.000Z",
    component,
    health_status: "HEALTHY" as const,
    contributing_factors: freezeArray([`${component} signal healthy`]),
    evidence_refs: evidenceRefs,
  }));
  return has(failures, "HEALTH_MONITORING_INCOMPLETE") ? freezeArray(records.slice(0, 6)) : freezeArray(records);
}

function buildAlerts(failures: readonly ObservabilityTelemetryFailure[], evidenceRefs: readonly string[]): readonly AlertRecord[] {
  const deterministic = !has(failures, "ALERT_ROUTING_NON_DETERMINISTIC");
  return freezeArray(["performance", "execution", "governance", "safety", "operator", "replay"].map((alertType, index) => nested({
    alert_id: `P3.10-ALERT-${String(index + 1).padStart(3, "0")}`,
    timestamp: "2026-07-17T00:24:00.000Z",
    alert_type: alertType,
    severity: index > 2 ? "MEDIUM" as const : "INFO" as const,
    originating_component: alertType,
    affected_agent: "agent:p3.10:observed",
    disposition: deterministic ? "ROUTED" as const : "OPEN" as const,
    route_ref: deterministic ? `route:observability:${alertType}` : "",
    deterministic,
    evidence_refs: evidenceRefs,
  })));
}

function buildDashboards(failures: readonly ObservabilityTelemetryFailure[]): readonly DashboardDefinition[] {
  const names = ["Agent Overview", "Runtime Dashboard", "Planning Dashboard", "Memory Dashboard", "Collaboration Dashboard", "Governance Dashboard", "Safety Dashboard", "Operator Dashboard", "Performance Dashboard", "Diagnostic Dashboard"];
  const dashboards = names.map((name, index) => nested({
    dashboard_id: `P3.10-DASHBOARD-${String(index + 1).padStart(3, "0")}`,
    dashboard_name: name,
    components: freezeArray(["telemetry", "metrics", "traces", "health", "alerts"]),
    filters: freezeArray(["agent", "tenant", "execution", "severity", "time"]),
    drill_down_enabled: true,
  }));
  return has(failures, "DASHBOARDS_INCOMPLETE") ? freezeArray(dashboards.slice(0, 8)) : freezeArray(dashboards);
}

function resultReplayHash(result: Omit<ObservabilityTelemetryResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    telemetry: result.telemetry_records.map((record) => record.integrity_hash),
    traces: result.trace_records.map((record) => record.integrity_hash),
    metrics: result.metric_records.map((record) => record.integrity_hash),
    diagnostics: result.diagnostic_records.map((record) => record.integrity_hash),
    health: result.health_records.map((record) => record.integrity_hash),
    alerts: result.alert_records.map((record) => record.integrity_hash),
    dashboards: result.dashboards.map((dashboard) => dashboard.integrity_hash),
    evidence: result.evidence.integrity_hash,
    replay: result.replay_validation.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ObservabilityTelemetryResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runObservabilityTelemetry(input: ObservabilityTelemetryInput = {}): ObservabilityTelemetryResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ObservabilityTelemetryFailure>(direct ? [direct] : []);
  const p31 = runAgentIdentityLifecycle();
  const p33 = runRuntimeOrchestration();
  const p34 = runMemoryKnowledge();
  const p35 = runPlanningReasoning();
  const p36 = runCollaborationFederation();
  const p37 = runGovernanceAuthorityPolicy();
  const p38 = runSafetyBehavioralConstraints();
  const p39 = runHumanOperatorInteraction();
  const dependencyFailures = freezeArray<ObservabilityTelemetryFailure>([
    ...(!validateAgentIdentityLifecycle(p31).valid || has(scenarioFailures, "P3_1_AGENT_REGISTRY_INVALID") ? ["P3_1_AGENT_REGISTRY_INVALID" as const] : []),
    ...(!validateRuntimeOrchestration(p33).valid || has(scenarioFailures, "P3_3_RUNTIME_INVALID") ? ["P3_3_RUNTIME_INVALID" as const] : []),
    ...(!validateMemoryKnowledge(p34).valid || has(scenarioFailures, "P3_4_MEMORY_INVALID") ? ["P3_4_MEMORY_INVALID" as const] : []),
    ...(!validatePlanningReasoning(p35).valid || has(scenarioFailures, "P3_5_PLANNING_INVALID") ? ["P3_5_PLANNING_INVALID" as const] : []),
    ...(!validateCollaborationFederation(p36).valid || has(scenarioFailures, "P3_6_COLLABORATION_INVALID") ? ["P3_6_COLLABORATION_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_GOVERNANCE_INVALID") ? ["P3_7_GOVERNANCE_INVALID" as const] : []),
    ...(!validateSafetyBehavioralConstraints(p38).valid || has(scenarioFailures, "P3_8_SAFETY_INVALID") ? ["P3_8_SAFETY_INVALID" as const] : []),
    ...(!validateHumanOperatorInteraction(p39).valid || has(scenarioFailures, "P3_9_INTERACTION_INVALID") ? ["P3_9_INTERACTION_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const evidenceRefs = has(failures, "OPERATIONAL_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["evidence:p3.10:telemetry", "evidence:p3.10:trace", "evidence:p3.10:metric", "evidence:p3.10:diagnostic"]);
  const telemetry_records = buildTelemetry(failures);
  const trace_records = buildTraces(failures);
  const metric_records = buildMetrics(failures);
  const diagnostic_records = buildDiagnostics(failures);
  const health_records = buildHealth(failures, evidenceRefs);
  const alert_records = buildAlerts(failures, evidenceRefs);
  const dashboards = buildDashboards(failures);
  const evidence = nested({
    evidence_id: "P3.10-OPERATIONAL-EVIDENCE-001",
    telemetry_evidence_refs: evidenceRefs.length ? freezeArray(telemetry_records.map((record) => record.telemetry_id)) : freezeArray([]),
    trace_evidence_refs: evidenceRefs.length ? freezeArray(trace_records.map((record) => record.span_id)) : freezeArray([]),
    metric_evidence_refs: evidenceRefs.length ? freezeArray(metric_records.map((record) => record.metric_id)) : freezeArray([]),
    diagnostic_evidence_refs: evidenceRefs.length ? freezeArray(diagnostic_records.map((record) => record.diagnostic_id)) : freezeArray([]),
    immutable: evidenceRefs.length > 0,
    replayable: evidenceRefs.length > 0,
    audit_ready: evidenceRefs.length > 0,
  });
  const replay_validation = nested({
    replay_validation_id: "P3.10-REPLAY-VALIDATION-001",
    telemetry_replayed: telemetry_records.length >= 8,
    traces_replayed: trace_records.every((record) => record.replayable),
    metrics_replayed: metric_records.length >= 9,
    diagnostics_replayed: diagnostic_records.length >= 8,
    health_replayed: health_records.length >= 8,
    alerts_replayed: alert_records.every((record) => record.deterministic),
    dashboards_replayed: dashboards.length >= 10,
    deterministic: !has(failures, "REPLAY_DIVERGENCE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(has(failures, "CCI_OBSERVABILITY_NOT_CONSUMED") ? ["CCI_OBSERVABILITY_NOT_CONSUMED" as const] : []),
    ...(telemetry_records.length < 8 ? ["TELEMETRY_INCOMPLETE" as const] : []),
    ...(trace_records.some((record) => record.duration_ms !== 250) ? ["TRACE_NON_DETERMINISTIC" as const] : []),
    ...(trace_records.some((record) => !record.replayable) ? ["TRACE_NOT_REPLAYABLE" as const] : []),
    ...(metric_records.length < 9 ? ["METRICS_INCOMPLETE" as const] : []),
    ...(diagnostic_records.length < 8 ? ["DIAGNOSTICS_INCOMPLETE" as const] : []),
    ...(health_records.length < 8 ? ["HEALTH_MONITORING_INCOMPLETE" as const] : []),
    ...(dashboards.length < 10 ? ["DASHBOARDS_INCOMPLETE" as const] : []),
    ...(alert_records.some((record) => !record.deterministic || record.route_ref.length === 0) ? ["ALERT_ROUTING_NON_DETERMINISTIC" as const] : []),
    ...(!evidence.immutable || !evidence.replayable || !evidence.audit_ready ? ["OPERATIONAL_EVIDENCE_MISSING" as const] : []),
    ...(!replay_validation.deterministic ? ["REPLAY_DIVERGENCE" as const] : []),
    ...(has(failures, "CCI_OBSERVABILITY_DUPLICATED") ? ["CCI_OBSERVABILITY_DUPLICATED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.10-OBSERVABILITY-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    consumes_cci_observability: !has(derivedFailures, "CCI_OBSERVABILITY_NOT_CONSUMED"),
    does_not_duplicate_cci: !has(derivedFailures, "CCI_OBSERVABILITY_DUPLICATED"),
    telemetry_complete: telemetry_records.length >= 8,
    traces_deterministic: trace_records.every((record) => record.duration_ms === 250),
    traces_replayable: trace_records.every((record) => record.replayable),
    metrics_complete: metric_records.length >= 9,
    diagnostics_complete: diagnostic_records.length >= 8,
    health_monitoring_complete: health_records.length >= 8,
    dashboards_complete: dashboards.length >= 10,
    alerts_routed_deterministically: alert_records.every((record) => record.deterministic && record.route_ref.length > 0),
    evidence_complete: evidence.immutable && evidence.replayable && evidence.audit_ready,
    replay_reproducible: replay_validation.deterministic,
    failures: derivedFailures,
  });
  const base: Omit<ObservabilityTelemetryResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    cci_observability_ref: "Program 2 - CCI Observability Infrastructure",
    cci_logging_ref: "Program 2 - CCI Logging Infrastructure",
    cci_metrics_ref: "Program 2 - CCI Metrics Infrastructure",
    cci_tracing_ref: "Program 2 - CCI Distributed Tracing",
    cci_events_ref: "Program 2 - CCI Event Infrastructure",
    cci_evidence_ref: "Program 2 - CCI Evidence Infrastructure",
    agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1",
    runtime_orchestration_ref: "caf-runtime-orchestration/v3.3",
    memory_knowledge_ref: "caf-memory-knowledge/v3.4",
    planning_reasoning_ref: "caf-planning-reasoning/v3.5",
    collaboration_federation_ref: "caf-collaboration-federation/v3.6",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8",
    human_operator_interaction_ref: "caf-human-operator-interaction/v3.9",
    telemetry_records,
    trace_records,
    metric_records,
    diagnostic_records,
    health_records,
    alert_records,
    dashboards,
    evidence,
    replay_validation,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateObservabilityTelemetry(result?: ObservabilityTelemetryResult): ObservabilityTelemetryValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, telemetry_valid: false, traces_valid: false, metrics_valid: false, diagnostics_valid: false, health_valid: false, alerts_valid: false, dashboards_valid: false, evidence_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && verifyHashedRecord(result.certification);
  const telemetry_valid = result.telemetry_records.length >= 8 && result.telemetry_records.every(verifyHashedRecord);
  const traces_valid = result.trace_records.length >= 8 && result.trace_records.every((record) => verifyHashedRecord(record) && record.duration_ms === 250 && record.replayable);
  const metrics_valid = result.metric_records.length >= 9 && result.metric_records.every(verifyHashedRecord);
  const diagnostics_valid = result.diagnostic_records.length >= 8 && result.diagnostic_records.every(verifyHashedRecord);
  const health_valid = result.health_records.length >= 8 && result.health_records.every((record) => verifyHashedRecord(record) && record.evidence_refs.length > 0);
  const alerts_valid = result.alert_records.length >= 6 && result.alert_records.every((record) => verifyHashedRecord(record) && record.deterministic && record.route_ref.length > 0);
  const dashboards_valid = result.dashboards.length >= 10 && result.dashboards.every((dashboard) => verifyHashedRecord(dashboard) && dashboard.drill_down_enabled);
  const evidence_valid = verifyHashedRecord(result.evidence) && result.evidence.immutable && result.evidence.replayable && result.evidence.audit_ready;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && telemetry_valid && traces_valid && metrics_valid && diagnostics_valid && health_valid && alerts_valid && dashboards_valid && evidence_valid && certification_valid && result.replay_validation.deterministic;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, telemetry_valid, traces_valid, metrics_valid, diagnostics_valid, health_valid, alerts_valid, dashboards_valid, evidence_valid, certification_valid, failures: result.certification.failures });
}

export function replayObservabilityTelemetry(result = runObservabilityTelemetry()): boolean {
  const replayed = runObservabilityTelemetry();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateObservabilityTelemetry(result).valid;
}

export function getObservabilityTelemetryBundle(): ObservabilityTelemetryBundle {
  const result = runObservabilityTelemetry();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_agent_observability: true,
      consumes_cci_observability: true,
      duplicates_cci_observability: false,
      deterministic_traces_required: true,
      replay_safe_required: true,
      operational_evidence_required: true,
    }),
    result,
    validation: validateObservabilityTelemetry(result),
  });
}

export const ObservabilityTelemetryService = Object.freeze({
  run: runObservabilityTelemetry,
  validate: validateObservabilityTelemetry,
  replay: replayObservabilityTelemetry,
});
