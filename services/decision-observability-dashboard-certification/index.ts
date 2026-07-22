import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLedgerIntegrityCertification } from "@/services/decision-ledger-integrity-certification";
import type { LedgerIntegrityCertificationResult } from "@/types/decision-ledger-integrity-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  DashboardCoverageReport,
  DashboardSnapshot,
  ObservabilityCertificationLedgerEntry,
  ObservabilityCertificationReport,
  ObservabilityCertificationState,
  ObservabilityDashboardCertificationFailure,
  ObservabilityDashboardCertificationFoundation,
  ObservabilityDashboardCertificationInput,
  ObservabilityDashboardCertificationResult,
  ObservabilityDashboardCertificationValidation,
  ObservabilityDashboardCheck,
  ObservabilityDashboardScope,
  ObservabilityEvidencePackage,
  StateMonitoringReport,
  TimelineVerificationReport,
  VisibilityVerificationReport,
} from "@/types/decision-observability-dashboard-certification";

const CERTIFICATION_VERSION = "decision-observability-dashboard-certification/v1" as const;

export const OBSERVABILITY_DASHBOARD_SCOPES: readonly ObservabilityDashboardScope[] = Object.freeze(["ACTIVE_DECISIONS", "BLOCKED_DECISIONS", "ESCALATIONS", "CONFLICTS", "DEPENDENCIES", "TIMELINE", "REPLAY", "GOVERNANCE", "CERTIFICATION", "OPERATOR_ACTIVITY", "SYSTEM_HEALTH"]);
export const OBSERVABILITY_DASHBOARD_CHECKS: readonly ObservabilityDashboardCheck[] = Object.freeze(["DASHBOARD_COVERAGE", "STATE_VISIBILITY", "TRANSITION_VISIBILITY", "TIMELINE_ACCURACY", "REPLAY_VISIBILITY", "GOVERNANCE_VISIBILITY", "CERTIFICATION_VISIBILITY", "OPERATOR_VISIBILITY", "TENANT_ISOLATION", "INTEGRITY_VERIFICATION"]);

type Scenario = NonNullable<ObservabilityDashboardCertificationInput["scenario"]>;

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

function state(pass: boolean): ObservabilityCertificationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: LedgerIntegrityCertificationResult) {
  return {
    tenant_id: source.ledger_report.tenant_id,
    mission_id: source.ledger_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: LedgerIntegrityCertificationResult, role: VisibilityRole): boolean {
  return source.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildSnapshot(source: LedgerIntegrityCertificationResult, scenario: Scenario): DashboardSnapshot {
  const c = ctx(source);
  const base: Omit<DashboardSnapshot, "integrity_hash"> = {
    dashboard_id: "observability_dashboard_snapshot",
    tenant_id: scenario === "CROSS_TENANT" ? `${c.tenant_id}_foreign` : c.tenant_id,
    mission_id: c.mission_id,
    active_decisions: scenario === "MISSING_ACTIVE_DECISION" ? freezeArray([]) : freezeArray(["decision:alpha:active"]),
    blocked_decisions: scenario === "MISSING_BLOCKED_DECISION" ? freezeArray([]) : freezeArray(["decision:bravo:blocked"]),
    blocking_reasons: scenario === "MISSING_BLOCKED_DECISION" ? freezeArray([]) : freezeArray(["blocker:missing-approval", "blocker:dependency"]),
    escalations: scenario === "MISSING_ESCALATION" ? freezeArray([]) : freezeArray(["escalation:mission-owner"]),
    conflicts: scenario === "MISSING_CONFLICT" ? freezeArray([]) : freezeArray(["conflict:priority-vs-risk:medium"]),
    dependencies: scenario === "MISSING_DEPENDENCY" ? freezeArray([]) : freezeArray(["dependency:alpha->bravo", "critical-path:alpha"]),
    timeline_events: scenario === "MISSING_TIMELINE_EVENT" ? freezeArray([]) : freezeArray(["timeline:intake", "timeline:governance", "timeline:operator", "timeline:certification"]),
    replay_statuses: scenario === "MISSING_REPLAY_STATUS" ? freezeArray([]) : freezeArray(["replay:ready", "replay:integrity-pass", "replay:divergence-none"]),
    governance_statuses: scenario === "MISSING_GOVERNANCE_STATUS" ? freezeArray([]) : freezeArray(["governance:pass", "constitution:pass", "authority:valid"]),
    certification_statuses: scenario === "MISSING_CERTIFICATION_STATUS" ? freezeArray([]) : freezeArray(["certification:9.12.8:pass", "readiness:ready"]),
    operator_actions: scenario === "MISSING_OPERATOR_ACTION" ? freezeArray([]) : freezeArray(["operator:approval", "operator:review", "operator:history"]),
    system_health_conditions: scenario === "HIDDEN_SYSTEM_HEALTH" ? freezeArray([]) : freezeArray(["health:nominal", "alerts:none"]),
    replay_ref: scenario === "REPLAY_VISIBILITY_MISMATCH" ? "replay:visibility:mismatch" : c.replay_ref,
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.dashboard_id }) });
  return built;
}

function buildCoverage(source: LedgerIntegrityCertificationResult, snapshot: DashboardSnapshot, scenario: Scenario): DashboardCoverageReport {
  const c = ctx(source);
  const covered = scenario === "HIDDEN_STATE" ? OBSERVABILITY_DASHBOARD_SCOPES.slice(0, -1) : OBSERVABILITY_DASHBOARD_SCOPES;
  const base: Omit<DashboardCoverageReport, "integrity_hash"> = {
    coverage_report_id: "dashboard_coverage_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    covered_scopes: freezeArray(covered),
    feature_coverage_complete: covered.length === OBSERVABILITY_DASHBOARD_SCOPES.length,
    workflow_coverage_complete: scenario !== "HIDDEN_TRANSITION",
    decision_coverage_complete: snapshot.active_decisions.length > 0 && snapshot.blocked_decisions.length > 0,
    governance_coverage_complete: snapshot.governance_statuses.length > 0,
    replay_coverage_complete: snapshot.replay_statuses.length > 0,
    certification_coverage_complete: snapshot.certification_statuses.length > 0,
    operational_coverage_complete: snapshot.operator_actions.length > 0 && snapshot.system_health_conditions.length > 0,
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.feature_coverage_complete && base.workflow_coverage_complete && base.decision_coverage_complete && base.governance_coverage_complete && base.replay_coverage_complete && base.certification_coverage_complete && base.operational_coverage_complete) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildVisibility(source: LedgerIntegrityCertificationResult, snapshot: DashboardSnapshot, scenario: Scenario): VisibilityVerificationReport {
  const c = ctx(source);
  const hidden = scenario === "HIDDEN_STATE" ? freezeArray(["state:hidden"]) : scenario === "HIDDEN_TRANSITION" ? freezeArray(["transition:hidden"]) : freezeArray([]);
  const base: Omit<VisibilityVerificationReport, "integrity_hash"> = {
    visibility_report_id: "dashboard_visibility_verification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    state_visibility_complete: hidden.length === 0 && snapshot.active_decisions.length > 0,
    transition_visibility_complete: scenario !== "HIDDEN_TRANSITION",
    status_indicators_complete: snapshot.active_decisions.length > 0 && snapshot.blocked_decisions.length > 0 && snapshot.certification_statuses.length > 0,
    health_indicators_complete: snapshot.system_health_conditions.length > 0,
    alerts_generated: scenario !== "FAIL_OPEN",
    operator_notifications_complete: snapshot.operator_actions.length > 0,
    hidden_state_refs: hidden,
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.state_visibility_complete && base.transition_visibility_complete && base.status_indicators_complete && base.health_indicators_complete && base.alerts_generated && base.operator_notifications_complete && base.hidden_state_refs.length === 0) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildStateReport(source: LedgerIntegrityCertificationResult, scenario: Scenario): StateMonitoringReport {
  const c = ctx(source);
  const base: Omit<StateMonitoringReport, "integrity_hash"> = {
    state_report_id: "observability_state_monitoring_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    current_state_ref: scenario === "INCORRECT_DASHBOARD_DATA" ? "state:incorrect" : "state:under-review",
    previous_state_ref: "state:intake",
    transition_history_refs: scenario === "HIDDEN_TRANSITION" ? freezeArray([]) : freezeArray(["transition:intake->review", "transition:review->certification"]),
    transition_integrity_verified: scenario !== "HIDDEN_TRANSITION" && scenario !== "INCORRECT_DASHBOARD_DATA",
    state_consistency_verified: scenario !== "INCORRECT_DASHBOARD_DATA",
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(Boolean(base.current_state_ref) && Boolean(base.previous_state_ref) && base.transition_history_refs.length > 0 && base.transition_integrity_verified && base.state_consistency_verified) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildTimeline(source: LedgerIntegrityCertificationResult, snapshot: DashboardSnapshot, scenario: Scenario): TimelineVerificationReport {
  const c = ctx(source);
  const base: Omit<TimelineVerificationReport, "integrity_hash"> = {
    timeline_report_id: "observability_timeline_verification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    event_ordering_deterministic: scenario !== "INCORRECT_DASHBOARD_DATA",
    timestamp_sequence_valid: scenario !== "INCORRECT_DASHBOARD_DATA",
    workflow_chronology_complete: snapshot.timeline_events.length > 0,
    operator_chronology_complete: snapshot.operator_actions.length > 0,
    governance_chronology_complete: snapshot.governance_statuses.length > 0 && scenario !== "GOVERNANCE_DASHBOARD_INCONSISTENCY",
    replay_chronology_complete: snapshot.replay_statuses.length > 0 && scenario !== "REPLAY_DASHBOARD_INCONSISTENCY",
    certification_chronology_complete: snapshot.certification_statuses.length > 0,
    timeline_refs: snapshot.timeline_events,
    validation_state: "PASS",
  };
  const normalized = { ...base, validation_state: state(base.event_ordering_deterministic && base.timestamp_sequence_valid && base.workflow_chronology_complete && base.operator_chronology_complete && base.governance_chronology_complete && base.replay_chronology_complete && base.certification_chronology_complete && base.timeline_refs.length > 0) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidence(source: LedgerIntegrityCertificationResult, snapshot: DashboardSnapshot, coverage: DashboardCoverageReport, visibility: VisibilityVerificationReport, stateReport: StateMonitoringReport, timeline: TimelineVerificationReport, scenario: Scenario): ObservabilityEvidencePackage {
  const c = ctx(source);
  const base: Omit<ObservabilityEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "observability_dashboard_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    dashboard_evidence_refs: scenario === "HIDDEN_STATE" ? freezeArray([]) : freezeArray([snapshot.dashboard_id, coverage.coverage_report_id]),
    state_evidence_refs: scenario === "HIDDEN_TRANSITION" ? freezeArray([]) : freezeArray([visibility.visibility_report_id, stateReport.state_report_id]),
    timeline_evidence_refs: scenario === "MISSING_TIMELINE_EVENT" ? freezeArray([]) : freezeArray([timeline.timeline_report_id, ...timeline.timeline_refs]),
    governance_evidence_refs: scenario === "MISSING_GOVERNANCE_STATUS" ? freezeArray([]) : freezeArray(snapshot.governance_statuses),
    replay_evidence_refs: scenario === "MISSING_REPLAY_STATUS" ? freezeArray([]) : freezeArray([source.replay_hash, ...snapshot.replay_statuses]),
    operator_evidence_refs: scenario === "MISSING_OPERATOR_ACTION" ? freezeArray([]) : freezeArray(snapshot.operator_actions),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray([snapshot.integrity_hash, coverage.integrity_hash, visibility.integrity_hash, stateReport.integrity_hash, timeline.integrity_hash]),
    complete: scenario !== "HIDDEN_STATE" && scenario !== "MISSING_TIMELINE_EVENT" && scenario !== "MISSING_REPLAY_STATUS" && scenario !== "MISSING_GOVERNANCE_STATUS" && scenario !== "MISSING_OPERATOR_ACTION",
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  ledger: LedgerIntegrityCertificationResult;
  snapshot: DashboardSnapshot;
  coverage: DashboardCoverageReport;
  visibility: VisibilityVerificationReport;
  stateReport: StateMonitoringReport;
  timeline: TimelineVerificationReport;
  evidence: ObservabilityEvidencePackage;
  certificationLedger: readonly ObservabilityCertificationLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly ObservabilityDashboardCertificationFailure[] {
  const failures: ObservabilityDashboardCertificationFailure[] = [];
  if (input.ledger.validation.validation_status !== "VALID" || input.ledger.ledger_report.certification_decision !== "PASS") failures.push("LEDGER_INTEGRITY_CERTIFICATION_INVALID");
  if (!input.visibility.state_visibility_complete || input.visibility.hidden_state_refs.includes("state:hidden")) failures.push("HIDDEN_ORCHESTRATION_STATE");
  if (!input.visibility.transition_visibility_complete || !input.stateReport.transition_history_refs.length) failures.push("HIDDEN_WORKFLOW_TRANSITION");
  if (!input.snapshot.active_decisions.length) failures.push("MISSING_ACTIVE_DECISION");
  if (!input.snapshot.blocked_decisions.length || !input.snapshot.blocking_reasons.length) failures.push("MISSING_BLOCKED_DECISION");
  if (!input.snapshot.escalations.length) failures.push("MISSING_ESCALATION");
  if (!input.snapshot.conflicts.length) failures.push("MISSING_CONFLICT");
  if (!input.snapshot.dependencies.length) failures.push("MISSING_DEPENDENCY");
  if (!input.snapshot.timeline_events.length || !input.timeline.timeline_refs.length) failures.push("MISSING_TIMELINE_EVENT");
  if (!input.snapshot.replay_statuses.length) failures.push("MISSING_REPLAY_STATUS");
  if (!input.snapshot.governance_statuses.length) failures.push("MISSING_GOVERNANCE_STATUS");
  if (!input.snapshot.certification_statuses.length) failures.push("MISSING_CERTIFICATION_STATUS");
  if (!input.snapshot.operator_actions.length) failures.push("MISSING_OPERATOR_ACTION");
  if (input.stateReport.validation_state !== "PASS" || input.scenario === "INCORRECT_DASHBOARD_DATA") failures.push("INCORRECT_DASHBOARD_DATA");
  if (!input.timeline.replay_chronology_complete || input.scenario === "REPLAY_DASHBOARD_INCONSISTENCY") failures.push("REPLAY_DASHBOARD_INCONSISTENCY");
  if (!input.timeline.governance_chronology_complete || input.scenario === "GOVERNANCE_DASHBOARD_INCONSISTENCY") failures.push("GOVERNANCE_DASHBOARD_INCONSISTENCY");
  if (input.snapshot.tenant_id !== input.ledger.ledger_report.tenant_id) failures.push("CROSS_TENANT_DASHBOARD_DATA_EXPOSURE");
  if (!input.snapshot.system_health_conditions.length) failures.push("HIDDEN_SYSTEM_HEALTH_CONDITION");
  if (
    hashWithoutIntegrity(input.snapshot) !== input.snapshot.integrity_hash
    || hashWithoutIntegrity(input.coverage) !== input.coverage.integrity_hash
    || hashWithoutIntegrity(input.visibility) !== input.visibility.integrity_hash
    || hashWithoutIntegrity(input.stateReport) !== input.stateReport.integrity_hash
    || hashWithoutIntegrity(input.timeline) !== input.timeline.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.certificationLedger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || !input.evidence.integrity_evidence_refs.length
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.snapshot.replay_ref !== input.ledger.replay_hash || input.scenario === "REPLAY_VISIBILITY_MISMATCH") failures.push("REPLAY_VISIBILITY_MISMATCH");
  if (!input.evidence.immutable || input.certificationLedger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_DASHBOARD_BEHAVIOR");
  if (!visibleToRole(input.ledger, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildReport(source: LedgerIntegrityCertificationResult, snapshot: DashboardSnapshot, coverage: DashboardCoverageReport, timeline: TimelineVerificationReport, failures: readonly ObservabilityDashboardCertificationFailure[]): ObservabilityCertificationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<ObservabilityCertificationReport, "integrity_hash"> = {
    report_id: "observability_dashboard_certification_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Decision Orchestrator dashboards provide complete operator-visible, replay-aware, governance-transparent observability." : "Observability certification is blocked by dashboard coverage, visibility, timeline, replay, governance, or integrity failures.",
    certification_scope: OBSERVABILITY_DASHBOARD_SCOPES,
    certified_checks: OBSERVABILITY_DASHBOARD_CHECKS,
    dashboard_coverage_assessment: coverage.validation_state,
    active_decision_visibility: snapshot.active_decisions.length ? "PASS" : "FAIL",
    blocked_decision_visibility: snapshot.blocked_decisions.length && snapshot.blocking_reasons.length ? "PASS" : "FAIL",
    escalation_visibility: snapshot.escalations.length ? "PASS" : "FAIL",
    conflict_visibility: snapshot.conflicts.length ? "PASS" : "FAIL",
    dependency_visibility: snapshot.dependencies.length ? "PASS" : "FAIL",
    timeline_assessment: timeline.validation_state,
    replay_monitoring_assessment: snapshot.replay_statuses.length && !failures.includes("REPLAY_DASHBOARD_INCONSISTENCY") ? "PASS" : "FAIL",
    governance_visibility_assessment: snapshot.governance_statuses.length && !failures.includes("GOVERNANCE_DASHBOARD_INCONSISTENCY") ? "PASS" : "FAIL",
    certification_visibility_assessment: snapshot.certification_statuses.length ? "PASS" : "FAIL",
    operator_activity_assessment: snapshot.operator_actions.length ? "PASS" : "FAIL",
    integrity_verification: failures.includes("INTEGRITY_HASH_MISMATCH") ? "FAIL" : "PASS",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: LedgerIntegrityCertificationResult, evidence: ObservabilityEvidencePackage, report: ObservabilityCertificationReport, scenario: Scenario): readonly ObservabilityCertificationLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<ObservabilityCertificationLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "observability_cert_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "DASHBOARD_VALIDATED", scope_ref: "dashboard_coverage", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:30.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "observability_cert_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "VISIBILITY_VALIDATED", scope_ref: "operator_visibility", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:31.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "observability_cert_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "TIMELINE_VALIDATED", scope_ref: "timeline_reconstruction", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:32.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "observability_cert_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:33.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function buildValidation(failures: readonly ObservabilityDashboardCertificationFailure[]): ObservabilityDashboardCertificationValidation {
  const has = (failure: ObservabilityDashboardCertificationFailure) => failures.includes(failure);
  const base: Omit<ObservabilityDashboardCertificationValidation, "integrity_hash"> = {
    validation_id: "observability_dashboard_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    ledger_certification_valid: !has("LEDGER_INTEGRITY_CERTIFICATION_INVALID"),
    orchestration_states_visible: !has("HIDDEN_ORCHESTRATION_STATE"),
    workflow_transitions_visible: !has("HIDDEN_WORKFLOW_TRANSITION"),
    active_decisions_visible: !has("MISSING_ACTIVE_DECISION"),
    blocked_decisions_visible: !has("MISSING_BLOCKED_DECISION"),
    escalations_visible: !has("MISSING_ESCALATION"),
    conflicts_visible: !has("MISSING_CONFLICT"),
    dependencies_visible: !has("MISSING_DEPENDENCY"),
    timeline_events_visible: !has("MISSING_TIMELINE_EVENT"),
    replay_status_visible: !has("MISSING_REPLAY_STATUS"),
    governance_status_visible: !has("MISSING_GOVERNANCE_STATUS"),
    certification_status_visible: !has("MISSING_CERTIFICATION_STATUS"),
    operator_actions_visible: !has("MISSING_OPERATOR_ACTION"),
    dashboard_data_correct: !has("INCORRECT_DASHBOARD_DATA"),
    replay_dashboard_consistent: !has("REPLAY_DASHBOARD_INCONSISTENCY"),
    governance_dashboard_consistent: !has("GOVERNANCE_DASHBOARD_INCONSISTENCY"),
    tenant_isolated: !has("CROSS_TENANT_DASHBOARD_DATA_EXPOSURE"),
    system_health_visible: !has("HIDDEN_SYSTEM_HEALTH_CONDITION"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    replay_visibility_consistent: !has("REPLAY_VISIBILITY_MISMATCH"),
    fail_closed: !has("FAIL_OPEN_DASHBOARD_BEHAVIOR"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ObservabilityDashboardCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    snapshot: result.dashboard_snapshot,
    coverage: result.coverage_report,
    visibility: result.visibility_report,
    state: result.state_report,
    timeline: result.timeline_report,
    evidence: result.evidence_package,
    report: result.observability_report,
    ledger: result.observability_ledger,
    validation: result.validation,
  });
}

export function runObservabilityDashboardCertification(input: ObservabilityDashboardCertificationInput = {}): ObservabilityDashboardCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const ledger_certification = input.ledger_certification ?? runLedgerIntegrityCertification({ scenario: scenario === "LEDGER_INVALID" ? "HIDDEN_RECORDS" : "BASELINE" });
  const dashboard_snapshot = buildSnapshot(ledger_certification, scenario);
  const coverage_report = buildCoverage(ledger_certification, dashboard_snapshot, scenario);
  const visibility_report = buildVisibility(ledger_certification, dashboard_snapshot, scenario);
  const state_report = buildStateReport(ledger_certification, scenario);
  const timeline_report = buildTimeline(ledger_certification, dashboard_snapshot, scenario);
  const evidence_package = buildEvidence(ledger_certification, dashboard_snapshot, coverage_report, visibility_report, state_report, timeline_report, scenario);
  const preFailures = collectFailures({ ledger: ledger_certification, snapshot: dashboard_snapshot, coverage: coverage_report, visibility: visibility_report, stateReport: state_report, timeline: timeline_report, evidence: evidence_package, certificationLedger: [], role, scenario });
  const observability_report = buildReport(ledger_certification, dashboard_snapshot, coverage_report, timeline_report, preFailures);
  const observability_ledger = buildLedger(ledger_certification, evidence_package, observability_report, scenario);
  const failures = collectFailures({ ledger: ledger_certification, snapshot: dashboard_snapshot, coverage: coverage_report, visibility: visibility_report, stateReport: state_report, timeline: timeline_report, evidence: evidence_package, certificationLedger: observability_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<ObservabilityDashboardCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    ledger_certification,
    dashboard_snapshot,
    coverage_report,
    visibility_report,
    state_report,
    timeline_report,
    evidence_package,
    observability_report,
    observability_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_dashboard_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayObservabilityDashboardCertification(result: ObservabilityDashboardCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeDashboardSnapshotHash(record: Omit<DashboardSnapshot, "integrity_hash"> | DashboardSnapshot): string {
  return hashWithoutIntegrity(record);
}

export function getObservabilityDashboardCertificationFoundation(): ObservabilityDashboardCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: OBSERVABILITY_DASHBOARD_SCOPES,
    checks: OBSERVABILITY_DASHBOARD_CHECKS,
    result: runObservabilityDashboardCertification(),
  });
}

export const ObservabilityDashboardCertification = Object.freeze({
  run: runObservabilityDashboardCertification,
  replay: replayObservabilityDashboardCertification,
});
