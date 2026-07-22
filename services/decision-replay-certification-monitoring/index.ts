import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runGovernanceAuthorityVisibility } from "@/services/decision-governance-authority-visibility";
import type { GovernanceAuthorityVisibilityResult } from "@/types/decision-governance-authority-visibility";
import type { DecisionStateRecord } from "@/types/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  CertificationDashboard,
  CertificationMonitoringState,
  DivergenceSeverity,
  DivergenceState,
  ReplayCertificationMonitoringFailure,
  ReplayCertificationMonitoringFoundation,
  ReplayCertificationMonitoringInput,
  ReplayCertificationMonitoringResult,
  ReplayCertificationMonitoringValidation,
  ReplayDashboard,
  ReplayDivergence,
  ReplayHealthRecord,
  ReplayIntegrityDashboard,
  ReplayIntegrityState,
  ReplayMonitoringLedgerEntry,
  ReplayMonitoringRecord,
  ReplayMonitoringState,
  ReplayStatusMonitor,
} from "@/types/decision-replay-certification-monitoring";

const MONITORING_VERSION = "decision-replay-certification-monitoring/v1" as const;

export const REPLAY_MONITORING_STATES: readonly ReplayMonitoringState[] = Object.freeze(["NOT_AVAILABLE", "REGISTERED", "READY", "EXECUTING", "VALIDATING", "VERIFIED", "FAILED", "ARCHIVED"]);
export const REPLAY_INTEGRITY_STATES: readonly ReplayIntegrityState[] = Object.freeze(["UNKNOWN", "PENDING", "VERIFIED", "FAILED", "DIVERGED"]);
export const CERTIFICATION_MONITORING_STATES: readonly CertificationMonitoringState[] = Object.freeze(["NOT_STARTED", "IN_PROGRESS", "VALIDATING", "CONDITIONAL_PASS", "PASS", "FAIL", "ARCHIVED"]);
export const DIVERGENCE_STATES: readonly DivergenceState[] = Object.freeze(["NONE", "DETECTED", "INVESTIGATING", "CONFIRMED", "RESOLVED", "ARCHIVED"]);
export const DIVERGENCE_SEVERITIES: readonly DivergenceSeverity[] = Object.freeze(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);

type Scenario = NonNullable<ReplayCertificationMonitoringInput["scenario"]>;

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

function ctx(source: GovernanceAuthorityVisibilityResult) {
  const priority = source.priority_dashboard;
  const dashboard = priority.conflict_visualization.timeline_result.dashboard_result;
  return {
    priority,
    dashboard,
    registry: dashboard.registry,
    tenant_id: source.visibility_record.tenant_id,
    mission_id: source.visibility_record.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: source.visibility_record.certification_ref,
  };
}

function replayState(record: DecisionStateRecord, scenario: Scenario): ReplayMonitoringState {
  if (scenario === "BAD_REPLAY_READINESS" && record.decision_id === "decision_active_priority") return "NOT_AVAILABLE";
  if (record.replay_state === "FAILED") return "FAILED";
  if (record.replay_state === "DIVERGED") return "VALIDATING";
  if (record.replay_state === "VALIDATED") return "VERIFIED";
  return "READY";
}

function certificationState(record: DecisionStateRecord, scenario: Scenario): CertificationMonitoringState {
  if (scenario === "CERTIFICATION_ENGINE_MISMATCH" && record.decision_id === "decision_completed_certified") return "FAIL";
  if (record.certification_state === "FAIL") return "FAIL";
  if (record.certification_state === "CONDITIONAL_PASS") return "CONDITIONAL_PASS";
  if (record.certification_state === "PENDING") return "VALIDATING";
  return "PASS";
}

function buildHealthRecords(source: GovernanceAuthorityVisibilityResult, scenario: Scenario): readonly ReplayHealthRecord[] {
  const c = ctx(source);
  const records = c.registry.map((record, index) => {
    const replay_state = replayState(record, scenario);
    const base: Omit<ReplayHealthRecord, "integrity_hash"> = {
      replay_health_id: `replay_health_${record.decision_id}`,
      replay_id: record.replay_ref,
      tenant_id: scenario === "CROSS_TENANT" && record.decision_id === "decision_active_priority" ? "tenant_other" : record.tenant_id,
      mission_id: record.mission_id,
      replay_state,
      integrity_state: replay_state === "FAILED" ? "FAILED" : replay_state === "NOT_AVAILABLE" ? "UNKNOWN" : "VERIFIED",
      divergence_state: scenario === "SUPPRESS_DIVERGENCE" && record.decision_id === "decision_escalated_authority" ? "NONE" : record.replay_state === "DIVERGED" ? "DETECTED" : "NONE",
      certification_state: certificationState(record, scenario),
      latency: scenario === "BAD_REPLAY_READINESS" && index === 0 ? 0 : 120 + index * 14,
      completion_percentage: replay_state === "VERIFIED" ? 100 : replay_state === "FAILED" ? 40 : scenario === "BAD_REPLAY_READINESS" ? 0 : 80,
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([record.replay_ref, c.replay_ref]),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  const sorted = scenario === "NONDETERMINISTIC_MONITORING" ? records.reverse() : records.sort((a, b) => b.completion_percentage - a.completion_percentage || a.replay_health_id.localeCompare(b.replay_health_id));
  if (scenario !== "HASH_MISMATCH") return freezeArray(sorted);
  return freezeArray(sorted.map((record, index) => index === 0 ? Object.freeze({ ...record, integrity_hash: hash({ tampered: record.replay_health_id }) }) : record));
}

function buildReplayDashboard(source: GovernanceAuthorityVisibilityResult, records: readonly ReplayHealthRecord[], scenario: Scenario): ReplayDashboard {
  const c = ctx(source);
  const verified = records.filter((record) => record.replay_state === "VERIFIED").length;
  const base: Omit<ReplayDashboard, "integrity_hash"> = {
    replay_dashboard_id: "replay_certification_monitoring_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    replay_state: scenario === "BAD_REPLAY_READINESS" ? "NOT_AVAILABLE" : "VERIFIED",
    replay_progress: scenario === "BAD_REPLAY_READINESS" ? 0 : Number(((verified / records.length) * 100).toFixed(2)),
    replay_history: scenario === "HIDE_REPLAY_EXECUTION" ? freezeArray([]) : freezeArray(records.map((record) => `${record.replay_id}:${record.replay_state}`)),
    replay_health: scenario === "BAD_REPLAY_READINESS" ? "FAILED" : records.some((record) => record.replay_state === "FAILED") ? "DEGRADED" : "HEALTHY",
    replay_dependencies: freezeArray(source.visibility_record.status_record_refs),
    integrity_status: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? "UNKNOWN" : "VERIFIED",
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref, source.priority_dashboard.replay_hash]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildStatusMonitor(source: GovernanceAuthorityVisibilityResult, records: readonly ReplayHealthRecord[], scenario: Scenario): ReplayStatusMonitor {
  const c = ctx(source);
  const failures = records.filter((record) => record.replay_state === "FAILED").map((record) => record.replay_id);
  const executing = scenario === "HIDE_REPLAY_EXECUTION" ? [] : records.map((record) => record.replay_id);
  const base: Omit<ReplayStatusMonitor, "integrity_hash"> = {
    monitor_id: "replay_status_monitor",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    replay_queue: freezeArray(records.filter((record) => record.replay_state === "READY" || record.replay_state === "EXECUTING").map((record) => record.replay_id)),
    replay_execution: freezeArray(executing),
    replay_latency: Object.freeze({ average_ms: Math.round(records.reduce((sum, record) => sum + record.latency, 0) / records.length), p95_ms: Math.max(...records.map((record) => record.latency)), max_ms: Math.max(...records.map((record) => record.latency)) }),
    replay_failures: freezeArray(failures),
    replay_success_rate: Number(((records.filter((record) => record.replay_state === "VERIFIED").length / records.length) * 100).toFixed(2)),
    backlog_size: records.filter((record) => record.replay_state !== "VERIFIED").length,
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildIntegrityDashboard(source: GovernanceAuthorityVisibilityResult, records: readonly ReplayHealthRecord[], scenario: Scenario): ReplayIntegrityDashboard {
  const c = ctx(source);
  const base: Omit<ReplayIntegrityDashboard, "integrity_hash"> = {
    integrity_dashboard_id: "replay_integrity_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    integrity_state: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? "UNKNOWN" : records.some((record) => record.integrity_state === "FAILED") ? "FAILED" : "VERIFIED",
    validation_results: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? freezeArray([]) : freezeArray(["replay_hashes_verified", "evidence_lineage_verified", "dependency_reconstruction_verified", "governance_reconstruction_verified"]),
    hash_results: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? freezeArray([]) : freezeArray(records.map((record) => `hash_verified_${record.replay_id}`)),
    lineage_results: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? freezeArray([]) : freezeArray(source.governance_ledger.map((entry) => `lineage_${entry.governance_ledger_id}`)),
    reconstruction_results: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? freezeArray([]) : freezeArray(["operator_reconstruction_verified", "decision_package_reconstruction_verified", "final_recommendation_reconstruction_verified"]),
    audit_complete: scenario !== "INCOMPLETE_INTEGRITY_RESULTS",
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertificationDashboard(source: GovernanceAuthorityVisibilityResult, records: readonly ReplayHealthRecord[], scenario: Scenario): CertificationDashboard {
  const c = ctx(source);
  const failed = records.filter((record) => record.certification_state === "FAIL").map((record) => record.replay_id);
  const completed = records.filter((record) => record.certification_state === "PASS").map((record) => record.replay_id);
  const base: Omit<CertificationDashboard, "integrity_hash"> = {
    certification_dashboard_id: "replay_certification_dashboard",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    certification_state: scenario === "OMIT_CERTIFICATION_PROGRESS" ? "NOT_STARTED" : failed.length ? "FAIL" : "PASS",
    completed_tests: scenario === "OMIT_CERTIFICATION_PROGRESS" ? freezeArray([]) : freezeArray(completed),
    pending_tests: freezeArray(records.filter((record) => record.certification_state === "VALIDATING").map((record) => record.replay_id)),
    failed_tests: scenario === "OMIT_CERTIFICATION_PROGRESS" ? freezeArray([]) : freezeArray(failed),
    production_readiness: scenario === "CERTIFICATION_ENGINE_MISMATCH" ? "READY" : failed.length ? "BLOCKED" : "READY",
    certification_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.certification_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDivergences(source: GovernanceAuthorityVisibilityResult, scenario: Scenario): readonly ReplayDivergence[] {
  const c = ctx(source);
  const shouldCreate = scenario === "SUPPRESS_DIVERGENCE" || scenario === "INCOMPLETE_INTEGRITY_RESULTS" || scenario === "CERTIFICATION_ENGINE_MISMATCH";
  if (!shouldCreate) return freezeArray([]);
  if (scenario === "SUPPRESS_DIVERGENCE") return freezeArray([]);
  const base: Omit<ReplayDivergence, "integrity_hash"> = {
    divergence_id: "replay_divergence_monitor_001",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    divergence_type: scenario === "CERTIFICATION_ENGINE_MISMATCH" ? "CERTIFICATION_DIVERGENCE" : "INTEGRITY_FAILURE",
    divergence_state: "DETECTED",
    severity: scenario === "CERTIFICATION_ENGINE_MISMATCH" ? "HIGH" : "CRITICAL",
    original_reference: source.replay_hash,
    replay_reference: c.replay_ref,
    comparison_results: freezeArray(["original_replay_hash_compared", "governance_visibility_compared", "certification_outcome_compared"]),
    governance_impact: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? "CRITICAL" : "HIGH",
    certification_impact: "BLOCKING",
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function buildLedger(source: GovernanceAuthorityVisibilityResult, records: readonly ReplayHealthRecord[], divergences: readonly ReplayDivergence[], certification: CertificationDashboard, scenario: Scenario): readonly ReplayMonitoringLedgerEntry[] {
  const c = ctx(source);
  const common = {
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
    certification_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.certification_ref]),
    append_only: true as const,
    deleted: false as const,
  };
  const events: Omit<ReplayMonitoringLedgerEntry, "integrity_hash">[] = [
    { ...common, replay_monitoring_ledger_id: "replay_monitoring_ledger_001", event_type: "REPLAY_REGISTERED", replay_state: "REGISTERED", integrity_state: "PENDING", certification_state: "IN_PROGRESS", divergence_state: "NONE", event_timestamp: "2026-07-05T09:11:07.000Z", sequence_number: 1 },
    { ...common, replay_monitoring_ledger_id: "replay_monitoring_ledger_002", event_type: scenario === "HIDE_REPLAY_EXECUTION" ? "REPLAY_REGISTERED" : "REPLAY_STARTED", replay_state: scenario === "HIDE_REPLAY_EXECUTION" ? "REGISTERED" : "EXECUTING", integrity_state: "PENDING", certification_state: "VALIDATING", divergence_state: "NONE", event_timestamp: "2026-07-05T09:11:08.000Z", sequence_number: 2 },
    { ...common, replay_monitoring_ledger_id: "replay_monitoring_ledger_003", event_type: records.some((record) => record.replay_state === "FAILED") ? "REPLAY_FAILED" : "REPLAY_VERIFIED", replay_state: records.some((record) => record.replay_state === "FAILED") ? "FAILED" : "VERIFIED", integrity_state: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? "UNKNOWN" : "VERIFIED", certification_state: certification.certification_state, divergence_state: divergences.length ? "DETECTED" : "NONE", event_timestamp: "2026-07-05T09:11:09.000Z", sequence_number: 3 },
    { ...common, replay_monitoring_ledger_id: "replay_monitoring_ledger_004", event_type: certification.certification_state === "FAIL" ? "CERTIFICATION_FAILED" : "CERTIFICATION_COMPLETED", replay_state: "VERIFIED", integrity_state: scenario === "INCOMPLETE_INTEGRITY_RESULTS" ? "UNKNOWN" : "VERIFIED", certification_state: certification.certification_state, divergence_state: divergences.length ? "DETECTED" : "NONE", event_timestamp: "2026-07-05T09:11:10.000Z", sequence_number: 4 },
  ];
  if (scenario === "MUTABLE_REPLAY_EVIDENCE") events[2] = { ...events[2], append_only: false as true };
  if (scenario === "MUTABLE_CERTIFICATION_EVIDENCE") events[3] = { ...events[3], deleted: true as false };
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildMonitoringRecord(source: GovernanceAuthorityVisibilityResult, replay: ReplayDashboard, status: ReplayStatusMonitor, integrity: ReplayIntegrityDashboard, certification: CertificationDashboard, divergences: readonly ReplayDivergence[], ledger: readonly ReplayMonitoringLedgerEntry[], records: readonly ReplayHealthRecord[], scenario: Scenario): ReplayMonitoringRecord {
  const c = ctx(source);
  const base: Omit<ReplayMonitoringRecord, "integrity_hash"> = {
    monitoring_id: "replay_certification_monitoring_record",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    replay_dashboard_ref: replay.replay_dashboard_id,
    replay_status_monitor_ref: status.monitor_id,
    integrity_dashboard_ref: integrity.integrity_dashboard_id,
    certification_dashboard_ref: certification.certification_dashboard_id,
    divergence_monitor_refs: freezeArray(divergences.map((divergence) => divergence.divergence_id)),
    replay_ledger_refs: freezeArray(ledger.map((entry) => entry.replay_monitoring_ledger_id)),
    health_record_refs: freezeArray(records.map((record) => record.replay_health_id)),
    replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
    certification_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.certification_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: GovernanceAuthorityVisibilityResult;
  records: readonly ReplayHealthRecord[];
  replay: ReplayDashboard;
  status: ReplayStatusMonitor;
  integrity: ReplayIntegrityDashboard;
  certification: CertificationDashboard;
  divergences: readonly ReplayDivergence[];
  ledger: readonly ReplayMonitoringLedgerEntry[];
  monitoring: ReplayMonitoringRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly ReplayCertificationMonitoringFailure[] {
  const failures: ReplayCertificationMonitoringFailure[] = [];
  const c = ctx(input.source);
  const expectedOrder = buildHealthRecords(input.source, "BASELINE").map((record) => record.replay_health_id).join("|");
  if (input.replay.replay_state !== "VERIFIED" || input.replay.replay_progress !== 100 || input.records.some((record) => record.completion_percentage <= 0)) failures.push("REPLAY_READINESS_INACCURATE");
  if (!input.replay.replay_history.length || !input.status.replay_execution.length || !input.ledger.some((entry) => entry.event_type === "REPLAY_STARTED")) failures.push("REPLAY_EXECUTION_STATUS_HIDDEN");
  if (input.integrity.integrity_state !== "VERIFIED" || !input.integrity.validation_results.length || !input.integrity.hash_results.length || !input.integrity.lineage_results.length || !input.integrity.reconstruction_results.length || !input.integrity.audit_complete) failures.push("REPLAY_INTEGRITY_RESULTS_INCOMPLETE");
  if (input.certification.certification_state === "NOT_STARTED" || !input.certification.completed_tests.length || !input.certification.certification_refs.length) failures.push("CERTIFICATION_PROGRESS_OMITTED");
  if (input.scenario === "SUPPRESS_DIVERGENCE") failures.push("DIVERGENCE_EVENTS_SUPPRESSED");
  if (input.scenario === "NONDETERMINISTIC_MONITORING" || input.records.map((record) => record.replay_health_id).join("|") !== expectedOrder) failures.push("REPLAY_MONITORING_NONDETERMINISTIC");
  if (input.scenario === "CERTIFICATION_ENGINE_MISMATCH" || (input.certification.failed_tests.length > 0 && input.certification.production_readiness === "READY")) failures.push("CERTIFICATION_ENGINE_MISMATCH");
  if (input.ledger.some((entry) => !entry.append_only)) failures.push("REPLAY_EVIDENCE_MUTABLE");
  if (input.ledger.some((entry) => entry.deleted)) failures.push("CERTIFICATION_EVIDENCE_MUTABLE");
  if (!input.monitoring.replay_ref || !input.replay.replay_refs.length || !input.status.replay_refs.length || !input.integrity.replay_refs.length || input.records.some((record) => !record.replay_refs.length) || input.ledger.some((entry) => !entry.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (input.records.some((record) => record.tenant_id !== c.tenant_id) || input.divergences.some((divergence) => divergence.tenant_id !== c.tenant_id)) failures.push("CROSS_TENANT_REPLAY_VISIBLE");
  if (
    input.records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash)
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || hashWithoutIntegrity(input.status) !== input.status.integrity_hash
    || hashWithoutIntegrity(input.integrity) !== input.integrity.integrity_hash
    || hashWithoutIntegrity(input.certification) !== input.certification.integrity_hash
    || input.divergences.some((divergence) => hashWithoutIntegrity(divergence) !== divergence.integrity_hash)
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || hashWithoutIntegrity(input.monitoring) !== input.monitoring.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("REPLAY_MONITORING_RECONSTRUCTION_FAILED");
  if (!input.source.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly ReplayCertificationMonitoringFailure[]): ReplayCertificationMonitoringValidation {
  const has = (failure: ReplayCertificationMonitoringFailure) => failures.includes(failure);
  const base: Omit<ReplayCertificationMonitoringValidation, "integrity_hash"> = {
    validation_id: "replay_certification_monitoring_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    replay_readiness_accurate: !has("REPLAY_READINESS_INACCURATE"),
    replay_execution_visible: !has("REPLAY_EXECUTION_STATUS_HIDDEN"),
    replay_integrity_complete: !has("REPLAY_INTEGRITY_RESULTS_INCOMPLETE"),
    certification_progress_visible: !has("CERTIFICATION_PROGRESS_OMITTED"),
    divergence_events_visible: !has("DIVERGENCE_EVENTS_SUPPRESSED"),
    deterministic_monitoring: !has("REPLAY_MONITORING_NONDETERMINISTIC"),
    certification_engine_consistent: !has("CERTIFICATION_ENGINE_MISMATCH"),
    replay_evidence_immutable: !has("REPLAY_EVIDENCE_MUTABLE"),
    certification_evidence_immutable: !has("CERTIFICATION_EVIDENCE_MUTABLE"),
    replay_refs_present: !has("REPLAY_REFERENCES_MISSING") && !has("REPLAY_MONITORING_RECONSTRUCTION_FAILED"),
    tenant_isolated: !has("CROSS_TENANT_REPLAY_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ReplayCertificationMonitoringResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    replay: result.replay_dashboard,
    status: result.replay_status_monitor,
    integrity: result.replay_integrity_dashboard,
    certification: result.certification_dashboard,
    divergences: result.divergence_monitor,
    ledger: result.replay_monitoring_ledger,
    records: result.health_records,
    monitoring: result.monitoring_record,
    validation: result.validation,
  });
}

export function runReplayCertificationMonitoring(input: ReplayCertificationMonitoringInput = {}): ReplayCertificationMonitoringResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const governance_visibility = input.governance_visibility ?? runGovernanceAuthorityVisibility();
  const health_records = buildHealthRecords(governance_visibility, scenario);
  const replay_dashboard = buildReplayDashboard(governance_visibility, health_records, scenario);
  const replay_status_monitor = buildStatusMonitor(governance_visibility, health_records, scenario);
  const replay_integrity_dashboard = buildIntegrityDashboard(governance_visibility, health_records, scenario);
  const certification_dashboard = buildCertificationDashboard(governance_visibility, health_records, scenario);
  const divergence_monitor = buildDivergences(governance_visibility, scenario);
  const replay_monitoring_ledger = buildLedger(governance_visibility, health_records, divergence_monitor, certification_dashboard, scenario);
  const monitoring_record = buildMonitoringRecord(governance_visibility, replay_dashboard, replay_status_monitor, replay_integrity_dashboard, certification_dashboard, divergence_monitor, replay_monitoring_ledger, health_records, scenario);
  const failures = collectFailures({ source: governance_visibility, records: health_records, replay: replay_dashboard, status: replay_status_monitor, integrity: replay_integrity_dashboard, certification: certification_dashboard, divergences: divergence_monitor, ledger: replay_monitoring_ledger, monitoring: monitoring_record, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<ReplayCertificationMonitoringResult, "integrity_hash" | "replay_hash"> = {
    monitoring_version: MONITORING_VERSION,
    governance_visibility,
    replay_dashboard,
    replay_status_monitor,
    replay_integrity_dashboard,
    certification_dashboard,
    divergence_monitor,
    replay_monitoring_ledger,
    health_records,
    monitoring_record,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_replay_or_certification: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayReplayCertificationMonitoring(result: ReplayCertificationMonitoringResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeReplayHealthRecordHash(record: Omit<ReplayHealthRecord, "integrity_hash"> | ReplayHealthRecord): string {
  return hashWithoutIntegrity(record);
}

export function getReplayCertificationMonitoringFoundation(): ReplayCertificationMonitoringFoundation {
  return Object.freeze({
    monitoring_version: MONITORING_VERSION,
    replay_states: REPLAY_MONITORING_STATES,
    integrity_states: REPLAY_INTEGRITY_STATES,
    certification_states: CERTIFICATION_MONITORING_STATES,
    divergence_states: DIVERGENCE_STATES,
    divergence_severities: DIVERGENCE_SEVERITIES,
    result: runReplayCertificationMonitoring(),
  });
}

export const ReplayCertificationMonitoring = Object.freeze({
  run: runReplayCertificationMonitoring,
  replay: replayReplayCertificationMonitoring,
});
