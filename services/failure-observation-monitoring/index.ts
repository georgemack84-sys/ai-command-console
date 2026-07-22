import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runStressInjection } from "@/services/stress-injection-engine";
import type { FailureSeverity } from "@/types/scenario-definition-framework";
import type { InjectionEvent, StressInjectionLedger } from "@/types/stress-injection-engine";
import type {
  AnomalyRecord,
  DegradationGraph,
  FailureObservationContract,
  FailureObservationFailure,
  FailureObservationInput,
  FailureObservationLedger,
  FailureObservationObservabilitySurface,
  FailureObservationRecord,
  FailureObservationReplayResult,
  FailureObservationScenario,
  FailureObservationValidationResult,
  ObservationCategory,
  ObservationState,
  SubsystemHealthReport,
} from "@/types/failure-observation-monitoring";

const VERSION = "failure-observation-monitoring/v8ALT.6.3" as const;
const TENANT_ID = "tenant:autonomy:primary";
const categories = Object.freeze(["PLANNING_STABILITY", "EXECUTION_HEALTH", "DELEGATION_QUALITY", "ORCHESTRATION_HEALTH", "RUNTIME_SUPERVISION", "GOVERNANCE_COMPLIANCE", "AUTHORITY_ENFORCEMENT", "REPLAY_CONSISTENCY", "INTEGRITY_VERIFICATION", "MISSION_HEALTH", "CONFIDENCE_STABILITY", "RECOVERY_READINESS"] as const);
const states = Object.freeze(["INITIALIZING", "OBSERVING", "WARNING", "DEGRADED", "HIGH_RISK", "FAILURE_DETECTED", "RECOVERING", "STABLE", "TERMINATED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function score(severity: FailureSeverity): number { return severity === "CRITICAL" ? 0.42 : severity === "SEVERE" ? 0.5 : severity === "HIGH" ? 0.68 : 0.82; }

function failuresFor(scenario: FailureObservationScenario): readonly FailureObservationFailure[] {
  const map: Partial<Record<FailureObservationScenario, FailureObservationFailure>> = {
    MISSING_STRESS_LEDGER: "STRESS_LEDGER_MISSING",
    NONDETERMINISTIC_OBSERVATION_ORDERING: "OBSERVATION_ORDERING_NONDETERMINISTIC",
    MISSING_MONITOR_DOMAIN: "MONITOR_DOMAIN_MISSING",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY_UNDETECTED",
    GOVERNANCE_VISIBILITY_FAILURE: "GOVERNANCE_VISIBILITY_FAILED",
    CONSTITUTIONAL_VISIBILITY_FAILURE: "CONSTITUTIONAL_VISIBILITY_FAILED",
    AUTHORITY_VISIBILITY_FAILURE: "AUTHORITY_VISIBILITY_FAILED",
    INTEGRITY_FAILURE_NOT_DETECTED: "INTEGRITY_FAILURE_UNDETECTED",
    HIDDEN_OBSERVATION: "HIDDEN_OBSERVATION_DETECTED",
    INCOMPLETE_TELEMETRY_EVIDENCE: "TELEMETRY_EVIDENCE_INCOMPLETE",
    CROSS_TENANT_OBSERVATION: "CROSS_TENANT_OBSERVATION_DETECTED",
    MISSING_ANOMALY_LEDGER: "ANOMALY_LEDGER_MISSING",
    MISSING_RECOVERY_READINESS: "RECOVERY_READINESS_MISSING",
    INTEGRITY_HASH_FAILURE: "INTEGRITY_HASH_INVALID",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function sourceLedger(input: FailureObservationInput, failures: readonly FailureObservationFailure[]): StressInjectionLedger | null {
  if (failures.includes("STRESS_LEDGER_MISSING")) return null;
  if (input.stress_ledger) return input.stress_ledger;
  return runStressInjection({ tenant_id: input.tenant_id, mission_id: input.mission_id, scenario: failures.includes("REPLAY_INCONSISTENCY_UNDETECTED") ? "REPLAY_SYNC_FAILURE" : failures.includes("INTEGRITY_FAILURE_UNDETECTED") ? "INTEGRITY_FAILURE" : "BASELINE" });
}

function recordHash(record: Omit<FailureObservationRecord, "integrity_hash"> | FailureObservationRecord): string {
  const { integrity_hash: _hash, ...source } = record as FailureObservationRecord;
  return hashValue("failure-observation-record", source);
}

function observation(event: InjectionEvent, category: ObservationCategory, order: number, failures: readonly FailureObservationFailure[]): FailureObservationRecord {
  const visible = !failures.includes("HIDDEN_OBSERVATION_DETECTED");
  const replay = failures.includes("REPLAY_INCONSISTENCY_UNDETECTED") ? "" : event.replay_reference;
  const evidence = failures.includes("TELEMETRY_EVIDENCE_INCOMPLETE") ? "" : event.evidence_reference;
  const base = {
    observation_id: id("FOM", "failure-observation", { event: event.injection_id, category }),
    scenario_id: event.scenario_id,
    simulation_id: event.simulation_id,
    mission_id: event.mission_id,
    tenant_id: failures.includes("CROSS_TENANT_OBSERVATION_DETECTED") ? "external-tenant" : event.tenant_id,
    observed_component: category === "RECOVERY_READINESS" ? "RECOVERY_READINESS" as const : category === "CONFIDENCE_STABILITY" ? "CONFIDENCE_ENGINE" as const : event.target_component,
    observation_category: category,
    observation_state: event.severity === "CRITICAL" ? "FAILURE_DETECTED" as const : "DEGRADED" as const,
    health_score: score(event.severity),
    confidence_score: event.governance_validation === "VALIDATED" ? 0.91 : 0.41,
    severity: event.severity,
    failure_detected: true,
    failure_type: event.failure_type,
    governance_status: failures.includes("GOVERNANCE_VISIBILITY_FAILED") ? "FAILED" as const : "VISIBLE" as const,
    constitutional_status: failures.includes("CONSTITUTIONAL_VISIBILITY_FAILED") ? "FAILED" as const : "VISIBLE" as const,
    authority_status: failures.includes("AUTHORITY_VISIBILITY_FAILED") ? "FAILED" as const : "VISIBLE" as const,
    timestamp: event.execution_timestamp,
    sequence_number: failures.includes("OBSERVATION_ORDERING_NONDETERMINISTIC") ? 999 - order : order,
    replay_reference: replay,
    lineage_reference: event.lineage_reference,
    evidence_reference: evidence,
    operator_visible: visible,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") && order === 1 ? "" : recordHash(base as Omit<FailureObservationRecord, "integrity_hash">) });
}

function observations(stress: StressInjectionLedger | null, failures: readonly FailureObservationFailure[]): readonly FailureObservationRecord[] {
  if (!stress) return freezeArray([]);
  const domainList = failures.includes("MONITOR_DOMAIN_MISSING") || failures.includes("RECOVERY_READINESS_MISSING") ? categories.filter((item) => item !== "RECOVERY_READINESS") : categories;
  const records = domainList.map((category, index) => observation(stress.events[index % stress.events.length], category, index + 1, failures));
  if (failures.includes("OBSERVATION_ORDERING_NONDETERMINISTIC")) return freezeArray(records);
  return freezeArray(records.sort((a, b) => a.sequence_number - b.sequence_number));
}

function anomalyHash(anomaly: Omit<AnomalyRecord, "anomaly_hash"> | AnomalyRecord): string {
  const { anomaly_hash: _hash, ...source } = anomaly as AnomalyRecord;
  return hashValue("failure-anomaly", source);
}

function anomaly(record: FailureObservationRecord): AnomalyRecord {
  const base = { anomaly_id: id("ANOM", "failure-anomaly", record.observation_id), anomaly_classification: record.failure_type.toLowerCase(), affected_subsystem: record.observed_component, severity: record.severity, evidence_chain: freezeArray([record.evidence_reference].filter(Boolean)), replay_reference: record.replay_reference, governance_evaluation: record.governance_status, authority_evaluation: record.authority_status, integrity_verification: record.integrity_hash ? "VERIFIED" : "FAILED", operator_visible: record.operator_visible };
  return Object.freeze({ ...base, anomaly_hash: anomalyHash(base) });
}

function graphHash(graph: Omit<DegradationGraph, "graph_hash"> | DegradationGraph): string {
  const { graph_hash: _hash, ...source } = graph as DegradationGraph;
  return hashValue("failure-degradation-graph", source);
}

function degradationGraph(records: readonly FailureObservationRecord[]): DegradationGraph {
  const nodes = records.map((item) => `${item.observation_category}:${item.health_score}`);
  const edges = records.slice(1).map((item, index) => `${records[index].observation_id}->${item.observation_id}`);
  const base = { graph_id: id("FDG", "failure-degradation-graph", nodes), nodes: freezeArray(nodes), edges: freezeArray(edges) };
  return Object.freeze({ ...base, graph_hash: graphHash(base) });
}

function reportHash(report: Omit<SubsystemHealthReport, "report_hash"> | SubsystemHealthReport): string {
  const { report_hash: _hash, ...source } = report as SubsystemHealthReport;
  return hashValue("failure-health-report", source);
}

function healthReport(records: readonly FailureObservationRecord[]): SubsystemHealthReport {
  const avg = (category: ObservationCategory) => records.find((item) => item.observation_category === category)?.health_score ?? 0;
  const base = { report_id: id("FHR", "failure-health-report", records.map((item) => item.integrity_hash)), planning_health: avg("PLANNING_STABILITY"), execution_health: avg("EXECUTION_HEALTH"), orchestration_health: avg("ORCHESTRATION_HEALTH"), delegation_health: avg("DELEGATION_QUALITY"), governance_health: avg("GOVERNANCE_COMPLIANCE"), replay_health: avg("REPLAY_CONSISTENCY"), integrity_health: avg("INTEGRITY_VERIFICATION"), mission_health: avg("MISSION_HEALTH"), recovery_readiness: avg("RECOVERY_READINESS") };
  return Object.freeze({ ...base, report_hash: reportHash(base) });
}

function ledgerHash(ledger: Omit<FailureObservationLedger, "ledger_hash"> | FailureObservationLedger): string {
  const { ledger_hash: _hash, ...source } = ledger as FailureObservationLedger;
  return hashValue("failure-observation-ledger", source);
}

export function observeFailures(input: FailureObservationInput = {}): FailureObservationLedger {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const stress = sourceLedger(input, failures);
  const records = observations(stress, failures);
  const anomalies = failures.includes("ANOMALY_LEDGER_MISSING") ? freezeArray<AnomalyRecord>([]) : freezeArray(records.filter((item) => item.failure_detected).map(anomaly));
  const ledgerId = id("FOL", "failure-observation-ledger", { simulation: stress?.simulation_id ?? "missing", scenario: input.scenario ?? "BASELINE" });
  const base = {
    ledger_id: ledgerId,
    engine_version: VERSION,
    tenant_id: failures.includes("CROSS_TENANT_OBSERVATION_DETECTED") ? "external-tenant" : input.tenant_id ?? stress?.tenant_id ?? TENANT_ID,
    mission_id: input.mission_id ?? stress?.mission_id ?? "mission:failure-observation",
    simulation_id: stress?.simulation_id ?? "",
    source_stress_ledger: stress,
    observations: records,
    failure_timeline: freezeArray(records.map((item) => `${item.timestamp}|${item.sequence_number}|${item.observation_category}|${item.observation_state}`)),
    degradation_graph: degradationGraph(records),
    subsystem_health_report: healthReport(records),
    intervention_log: freezeArray(records.filter((item) => item.observation_state === "FAILURE_DETECTED" || item.observation_state === "DEGRADED").map((item) => `operator notification recommended for ${item.observation_category}`)),
    anomaly_ledger: anomalies,
    replay_reference: failures.includes("REPLAY_INCONSISTENCY_UNDETECTED") ? "" : `replay:failure-observation:${ledgerId}`,
    lineage_reference: `lineage:failure-observation:${ledgerId}`,
    append_only: true as const,
  };
  return Object.freeze({ ...base, ledger_hash: failures.includes("INTEGRITY_HASH_INVALID") || failures.includes("INTEGRITY_FAILURE_UNDETECTED") ? "" : ledgerHash(base as Omit<FailureObservationLedger, "ledger_hash">) });
}

export function getFailureTimeline(input: FailureObservationInput = {}): readonly string[] { return observeFailures(input).failure_timeline; }
export function getSubsystemHealthReport(input: FailureObservationInput = {}): SubsystemHealthReport { return observeFailures(input).subsystem_health_report; }
export function getAnomalyLedger(input: FailureObservationInput = {}): readonly AnomalyRecord[] { return observeFailures(input).anomaly_ledger; }

export function validateFailureObservation(ledger = observeFailures()): FailureObservationValidationResult {
  const observed = new Set(ledger.observations.map((item) => item.observation_category));
  const deterministic_ordering = ledger.observations.map((item) => item.sequence_number).join("|") === [...ledger.observations.map((item) => item.sequence_number)].sort((a, b) => a - b).join("|");
  const all_monitor_domains_present = categories.every((item) => observed.has(item));
  const replay_consistent = Boolean(ledger.replay_reference) && ledger.observations.every((item) => item.replay_reference);
  const governance_visible = ledger.observations.every((item) => item.governance_status === "VISIBLE");
  const constitutional_visible = ledger.observations.every((item) => item.constitutional_status === "VISIBLE");
  const authority_visible = ledger.observations.every((item) => item.authority_status === "VISIBLE");
  const sourceIntegrityFailed = Boolean(ledger.source_stress_ledger && !ledger.source_stress_ledger.ledger_hash);
  const integrity_failures_detected = !sourceIntegrityFailed || ledger.observations.some((item) => item.observation_category === "INTEGRITY_VERIFICATION" && item.failure_detected);
  const operator_visible = ledger.observations.every((item) => item.operator_visible) && ledger.anomaly_ledger.every((item) => item.operator_visible);
  const telemetry_evidence_complete = ledger.observations.every((item) => item.evidence_reference) && ledger.anomaly_ledger.every((item) => item.evidence_chain.length > 0);
  const tenant_isolated = ledger.tenant_id.startsWith("tenant:") && ledger.observations.every((item) => item.tenant_id === ledger.tenant_id);
  const anomaly_ledger_present = ledger.anomaly_ledger.length > 0;
  const recovery_readiness_present = observed.has("RECOVERY_READINESS") && ledger.subsystem_health_report.recovery_readiness > 0;
  const integrity_valid = Boolean(ledger.ledger_hash) && ledgerHash(ledger) === ledger.ledger_hash && ledger.observations.every((item) => Boolean(item.integrity_hash) && recordHash(item) === item.integrity_hash);
  const stress_ledger_present = Boolean(ledger.source_stress_ledger);
  const failures = unique([
    ...(!stress_ledger_present ? ["STRESS_LEDGER_MISSING" as const] : []),
    ...(!deterministic_ordering ? ["OBSERVATION_ORDERING_NONDETERMINISTIC" as const] : []),
    ...(!all_monitor_domains_present ? ["MONITOR_DOMAIN_MISSING" as const] : []),
    ...(!replay_consistent ? ["REPLAY_INCONSISTENCY_UNDETECTED" as const] : []),
    ...(!governance_visible ? ["GOVERNANCE_VISIBILITY_FAILED" as const] : []),
    ...(!constitutional_visible ? ["CONSTITUTIONAL_VISIBILITY_FAILED" as const] : []),
    ...(!authority_visible ? ["AUTHORITY_VISIBILITY_FAILED" as const] : []),
    ...(!integrity_failures_detected ? ["INTEGRITY_FAILURE_UNDETECTED" as const] : []),
    ...(!operator_visible ? ["HIDDEN_OBSERVATION_DETECTED" as const] : []),
    ...(!telemetry_evidence_complete ? ["TELEMETRY_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_OBSERVATION_DETECTED" as const] : []),
    ...(!anomaly_ledger_present ? ["ANOMALY_LEDGER_MISSING" as const] : []),
    ...(!recovery_readiness_present ? ["RECOVERY_READINESS_MISSING" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { ledger_id: ledger.ledger_id, valid, stress_ledger_present, deterministic_ordering, all_monitor_domains_present, replay_consistent, governance_visible, constitutional_visible, authority_visible, integrity_failures_detected, operator_visible, telemetry_evidence_complete, tenant_isolated, anomaly_ledger_present, recovery_readiness_present, integrity_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("failure-observation-validation", source) });
}

export function replayFailureObservation(ledger = observeFailures()): FailureObservationReplayResult {
  const reconstructed_hash = ledgerHash(ledger);
  const source = { replay_reference: ledger.replay_reference, ledger_id: ledger.ledger_id, deterministic: Boolean(ledger.replay_reference) && reconstructed_hash === ledger.ledger_hash, reconstructed_hash, original_hash: ledger.ledger_hash, observation_count: ledger.observations.length };
  return Object.freeze({ ...source, replay_result_hash: hashValue("failure-observation-replay", source) });
}

export function buildFailureObservationObservabilitySurface(ledger = observeFailures()): FailureObservationObservabilitySurface {
  return Object.freeze({ ledger_id: ledger.ledger_id, tenant_id: ledger.tenant_id, mission_id: ledger.mission_id, observation_count: ledger.observations.length, anomaly_count: ledger.anomaly_ledger.length, monitor_domains: freezeArray([...new Set(ledger.observations.map((item) => item.observation_category))]), append_only: true, ledger_hash: ledger.ledger_hash });
}

export function getFailureObservationContract(): FailureObservationContract {
  const ledger = observeFailures();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-observations", "simulation-telemetry-only", "governance-aware-telemetry", "constitutional-visibility", "authority-visibility", "operator-visible-monitoring", "replay-compatible-observations", "evidence-lineage-preservation", "tenant-isolation", "certification-ready-outputs"]),
      observation_categories: categories,
      observation_states: states,
      append_only: true,
    }),
    ledger,
    validation: validateFailureObservation(ledger),
    replay: replayFailureObservation(ledger),
    observability: buildFailureObservationObservabilitySurface(ledger),
  });
}
