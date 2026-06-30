import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runMissionControlVisibilityContract } from "@/services/mission-control-visibility-contract";
import type {
  DashboardRefreshMode,
  MissionControlOperationalDashboardInput,
  MissionControlOperationalDashboardObservabilitySurface,
  MissionControlOperationalDashboardReport,
  MissionControlOperationalDashboardScenario,
  MissionControlOperationalDashboardValidationResult,
  OperationalAlertRecord,
  OperationalDashboardFailure,
  OperationalDashboardValidationOutcome,
  OperationalDashboardValidationTest,
  OperationalExecutionState,
  OperationalGovernanceRecord,
  OperationalRiskRecord,
  OperationalSupervisionRecord,
  OperationalTimelineEvent,
} from "@/types/mission-control-operational-dashboard";

const NOW = "2026-07-01T03:00:00.000Z";
const SCHEMA_VERSION = "mission-control-operational-dashboard/v8J.2" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const EXECUTION_ID = "execution:autonomy:8j2:primary";
const REPLAY_REFERENCE = "replay:operational-dashboard:8j2:primary";
const LINEAGE_REFERENCE = "lineage:operational-dashboard:8j2:primary";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailure(scenario?: MissionControlOperationalDashboardScenario): OperationalDashboardFailure | null {
  const map: Partial<Record<MissionControlOperationalDashboardScenario, OperationalDashboardFailure>> = {
    INCOMPLETE_TIMELINE: "EXECUTION_TIMELINE_INCOMPLETE",
    NONDETERMINISTIC_STATE: "DASHBOARD_STATE_NONDETERMINISTIC",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_EXISTS",
    MISSING_GOVERNANCE: "GOVERNANCE_STATUS_MISSING",
    CONFIDENCE_NOT_REPRODUCIBLE: "CONFIDENCE_METRICS_NOT_REPRODUCIBLE",
    RISK_INCONSISTENT: "RISK_INDICATORS_INCONSISTENT",
    SUPERVISION_UNAVAILABLE: "SUPERVISION_HEALTH_UNAVAILABLE",
    MISSING_REPLAY_REFERENCE: "REPLAY_REFERENCE_MISSING",
    MISSING_LINEAGE_REFERENCE: "LINEAGE_REFERENCE_MISSING",
    MISSING_INTEGRITY_HASH: "INTEGRITY_HASH_MISSING",
    EXECUTION_AUTHORITY_EXPOSED: "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED",
    UNAUTHORIZED_ACCESS: "UNAUTHORIZED_DASHBOARD_ACCESS",
    CROSS_TENANT_DISPLAY: "CROSS_TENANT_INFORMATION_DISPLAYED",
  };
  return scenario ? map[scenario] ?? null : null;
}

function timelineEvent(event_type: OperationalTimelineEvent["event_type"], state: OperationalExecutionState, step_order: number, step_name: string, scenario?: MissionControlOperationalDashboardScenario): OperationalTimelineEvent {
  const missingReplay = scenario === "MISSING_REPLAY_REFERENCE" && step_order === 1;
  const missingLineage = scenario === "MISSING_LINEAGE_REFERENCE" && step_order === 1;
  const missingIntegrity = scenario === "MISSING_INTEGRITY_HASH" && step_order === 1;
  const source = {
    timeline_event_id: id("OTE", "operational-timeline-event-id", { event_type, step_order }),
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    tenant_id: scenario === "CROSS_TENANT_DISPLAY" && step_order === 1 ? "tenant:other" : TENANT_ID,
    event_type,
    execution_state: state,
    step_name,
    step_order,
    started_at: `2026-07-01T02:${(10 + step_order).toString().padStart(2, "0")}:00.000Z`,
    completed_at: state === "RUNNING" || state === "WAITING" ? null : `2026-07-01T02:${(11 + step_order).toString().padStart(2, "0")}:00.000Z`,
    duration: "PT1M",
    checkpoint_reference: event_type === "CHECKPOINT_CREATED" ? "checkpoint:8j2:primary" : null,
    retry_count: event_type.startsWith("RETRY") ? 1 : 0,
    rollback_reference: event_type.startsWith("ROLLBACK") ? "rollback:8j2:prepared" : null,
    operator_intervention: event_type === "ROLLBACK_STARTED",
    replay_reference: missingReplay ? "" : REPLAY_REFERENCE,
    lineage_reference: missingLineage ? "" : `${LINEAGE_REFERENCE}:timeline:${step_order}`,
    integrity_hash: missingIntegrity ? "" : hashValue("operational-timeline-integrity", { event_type, step_order }),
  };
  return Object.freeze({ ...source, event_hash: hashValue("operational-timeline-event", source) });
}

function buildTimeline(scenario?: MissionControlOperationalDashboardScenario): readonly OperationalTimelineEvent[] {
  const events = [
    timelineEvent("MISSION_CREATED", "PLANNING", 1, "Mission created", scenario),
    timelineEvent("PLAN_GENERATED", "READY", 2, "Plan generated", scenario),
    timelineEvent("EXECUTION_STARTED", "RUNNING", 3, "Execution started", scenario),
    timelineEvent("TASK_STARTED", "RUNNING", 4, "Task started", scenario),
    timelineEvent("TASK_COMPLETED", "RUNNING", 5, "Task completed", scenario),
    timelineEvent("CHECKPOINT_CREATED", "RUNNING", 6, "Checkpoint created", scenario),
    timelineEvent("RETRY_STARTED", "WAITING", 7, "Retry started", scenario),
    timelineEvent("RETRY_COMPLETED", "RUNNING", 8, "Retry completed", scenario),
    timelineEvent("FAILURE_DETECTED", "FAILED", 9, "Transient failure detected", scenario),
    timelineEvent("ROLLBACK_STARTED", "INTERVENED", 10, "Rollback prepared", scenario),
    timelineEvent("ROLLBACK_COMPLETED", "ROLLED_BACK", 11, "Rollback completed", scenario),
    timelineEvent("EXECUTION_COMPLETED", "COMPLETED", 12, "Execution completed", scenario),
    timelineEvent("MISSION_COMPLETED", "COMPLETED", 13, "Mission completed", scenario),
  ];
  if (scenario === "INCOMPLETE_TIMELINE") return freezeArray(events.slice(0, 5));
  if (scenario === "NONDETERMINISTIC_STATE") return freezeArray([events[1], events[0], ...events.slice(2)]);
  return freezeArray(events);
}

function buildState(scenario?: MissionControlOperationalDashboardScenario) {
  const state: OperationalExecutionState = scenario === "NONDETERMINISTIC_STATE" ? "READY" : "COMPLETED";
  const source = {
    state_record_id: id("OSR", "operational-state-record-id", { state }),
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    current_state: state,
    previous_state: "RUNNING" as OperationalExecutionState,
    state_entered_at: NOW,
    state_duration: "PT12M",
    transition_reason: scenario === "NONDETERMINISTIC_STATE" ? "invalid transition order detected" : "mission execution completed",
    transition_source: "execution-monitor",
    operator_required: false,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" ? "" : REPLAY_REFERENCE,
    lineage_reference: scenario === "MISSING_LINEAGE_REFERENCE" ? "" : `${LINEAGE_REFERENCE}:state`,
    integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("operational-state-integrity", state),
  };
  return Object.freeze({ ...source, state_hash: hashValue("operational-state-record", source) });
}

function buildGovernance(scenario?: MissionControlOperationalDashboardScenario): OperationalGovernanceRecord | null {
  if (scenario === "MISSING_GOVERNANCE") return null;
  const source = {
    governance_record_id: id("OGR", "operational-governance-record-id", "primary"),
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    constitutional_status: "COMPLIANT" as const,
    authority_validation: "AUTHORIZED" as const,
    policy_validation: "VALID" as const,
    governance_status: "PASS" as const,
    approval_status: "APPROVED" as const,
    blocking_reason: null,
    escalation_reference: null,
    evidence_reference: "evidence:governance:8j2",
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" ? "" : REPLAY_REFERENCE,
    lineage_reference: scenario === "MISSING_LINEAGE_REFERENCE" ? "" : `${LINEAGE_REFERENCE}:governance`,
    integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("operational-governance-integrity", "primary"),
  };
  return Object.freeze({ ...source, governance_hash: hashValue("operational-governance-record", source) });
}

function buildConfidence(scenario?: MissionControlOperationalDashboardScenario) {
  const score = scenario === "CONFIDENCE_NOT_REPRODUCIBLE" ? 0.37 : 0.89;
  const source = {
    confidence_record_id: id("OCF", "operational-confidence-record-id", score),
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    planning_confidence: "HIGH" as const,
    execution_confidence: scenario === "CONFIDENCE_NOT_REPRODUCIBLE" ? "LOW" as const : "HIGH" as const,
    recommendation_confidence: "MEDIUM" as const,
    supervision_confidence: "HIGH" as const,
    overall_confidence: score,
    trend_direction: scenario === "CONFIDENCE_NOT_REPRODUCIBLE" ? "VOLATILE" as const : "STABLE" as const,
    explanation: "Confidence is derived from planning, execution, recommendation, and supervision evidence.",
    confidence_factors: freezeArray(["planning completeness", "execution progress", "governance pass", "supervision health"]),
    timestamp: NOW,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" ? "" : REPLAY_REFERENCE,
    lineage_reference: scenario === "MISSING_LINEAGE_REFERENCE" ? "" : `${LINEAGE_REFERENCE}:confidence`,
    integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("operational-confidence-integrity", score),
  };
  return Object.freeze({ ...source, confidence_hash: hashValue("operational-confidence-record", source) });
}

function risk(category: OperationalRiskRecord["risk_category"], severity: OperationalRiskRecord["severity"], score: number, scenario?: MissionControlOperationalDashboardScenario): OperationalRiskRecord {
  const source = {
    risk_record_id: id("ORS", "operational-risk-record-id", { category, severity }),
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    risk_category: category,
    severity,
    likelihood: scenario === "RISK_INCONSISTENT" ? "VERY_LIKELY" as const : "POSSIBLE" as const,
    impact: severity === "CRITICAL" ? "SEVERE" as const : "MODERATE" as const,
    risk_score: scenario === "RISK_INCONSISTENT" ? 0.99 : score,
    mitigation: "Continue monitoring and retain rollback checkpoint.",
    owner: "mission-operator",
    status: "WATCHING" as const,
    timestamp: NOW,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" ? "" : REPLAY_REFERENCE,
    lineage_reference: scenario === "MISSING_LINEAGE_REFERENCE" ? "" : `${LINEAGE_REFERENCE}:risk:${category}`,
    integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("operational-risk-integrity", { category, severity, score }),
  };
  return Object.freeze({ ...source, risk_hash: hashValue("operational-risk-record", source) });
}

function buildRisks(scenario?: MissionControlOperationalDashboardScenario): readonly OperationalRiskRecord[] {
  return freezeArray([risk("EXECUTION", "MODERATE", 0.34, scenario), risk("POLICY", "LOW", 0.12, scenario), risk("GOVERNANCE", "LOW", 0.1, scenario), risk("OPERATIONAL", scenario === "RISK_INCONSISTENT" ? "CRITICAL" : "MODERATE", 0.29, scenario)]);
}

function buildSupervision(scenario?: MissionControlOperationalDashboardScenario): OperationalSupervisionRecord | null {
  if (scenario === "SUPERVISION_UNAVAILABLE") return null;
  const source = {
    supervision_record_id: id("OSV", "operational-supervision-record-id", "primary"),
    mission_id: MISSION_ID,
    execution_id: EXECUTION_ID,
    supervision_state: scenario === "HIDDEN_EXECUTION" ? "ESCALATED" as const : "STABLE" as const,
    health_score: scenario === "HIDDEN_EXECUTION" ? 0.31 : 0.92,
    drift_status: scenario === "HIDDEN_EXECUTION" ? "SEVERE" as const : "MINOR" as const,
    policy_violation_count: scenario === "HIDDEN_EXECUTION" ? 1 : 0,
    constitutional_violation_count: scenario === "HIDDEN_EXECUTION" ? 1 : 0,
    active_alerts: scenario === "HIDDEN_EXECUTION" ? 2 : 1,
    recommended_action: scenario === "HIDDEN_EXECUTION" ? "Investigate hidden execution evidence." : "Continue monitoring.",
    timestamp: NOW,
    replay_reference: scenario === "MISSING_REPLAY_REFERENCE" ? "" : REPLAY_REFERENCE,
    lineage_reference: scenario === "MISSING_LINEAGE_REFERENCE" ? "" : `${LINEAGE_REFERENCE}:supervision`,
    integrity_hash: scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("operational-supervision-integrity", "primary"),
  };
  return Object.freeze({ ...source, supervision_hash: hashValue("operational-supervision-record", source) });
}

function buildAlerts(scenario?: MissionControlOperationalDashboardScenario): readonly OperationalAlertRecord[] {
  const categories: readonly OperationalAlertRecord["category"][] = ["MISSION_STARTED", "CHECKPOINT_CREATED", "DRIFT_DETECTED", "ROLLBACK_READY", "MISSION_COMPLETED"];
  return freezeArray(categories.map((category, index) => {
    const source = {
      alert_id: id("OAL", "operational-alert-id", { category, index }),
      mission_id: MISSION_ID,
      severity: category === "DRIFT_DETECTED" || scenario === "HIDDEN_EXECUTION" ? "HIGH" as const : "LOW" as const,
      category,
      description: `${category} observed by Mission Control.`,
      recommended_action: category === "DRIFT_DETECTED" ? "Review supervision monitor." : "No action required.",
      operator_required: category === "DRIFT_DETECTED" || scenario === "HIDDEN_EXECUTION",
      timestamp: `2026-07-01T02:${(30 + index).toString().padStart(2, "0")}:00.000Z`,
    };
    return Object.freeze({ ...source, alert_hash: hashValue("operational-alert-record", source) });
  }));
}

function buildRefresh(refresh_mode: DashboardRefreshMode) {
  const source = {
    refresh_id: id("ODR", "operational-dashboard-refresh-id", refresh_mode),
    refresh_mode,
    certified_data_sources: freezeArray(["mission-control-visibility-contract", "execution-monitor", "runtime-observation-engine", "governance-policy-enforcement-engine", "replay-historical-reconstruction-query"]),
    deterministic_refresh_order: freezeArray(["visibility-contract", "timeline", "state", "governance", "confidence", "risk", "supervision", "summary", "alerts"]),
    replay_frozen_at: refresh_mode === "REPLAY_MODE" || refresh_mode === "SNAPSHOT_MODE" ? NOW : null,
    historical_snapshot_immutable: refresh_mode === "REPLAY_MODE" || refresh_mode === "SNAPSHOT_MODE",
  };
  return Object.freeze({ ...source, refresh_hash: hashValue("operational-dashboard-refresh", source) });
}

function validationTest(name: string, passed: boolean, failure: OperationalDashboardFailure, evidence: readonly string[]): OperationalDashboardValidationTest {
  const source = { name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence) };
  return Object.freeze({ test_id: id("ODT", "operational-dashboard-test-id", name), ...source, test_hash: hashValue("operational-dashboard-validation-test", source) });
}

function buildTests(report: Omit<MissionControlOperationalDashboardReport, "validation_tests" | "failures" | "validation_outcome" | "dashboard_hash" | "integrity_hash">, scenario?: MissionControlOperationalDashboardScenario): readonly OperationalDashboardValidationTest[] {
  const evidence = [report.dashboard_id, report.visibility_contract.report_hash, report.refresh_record.refresh_hash];
  const refs = [
    ...report.timeline.map((item) => item.replay_reference),
    report.state_monitor.replay_reference,
    report.governance_panel?.replay_reference ?? "",
    report.confidence_monitor.replay_reference,
    report.supervision_monitor?.replay_reference ?? "",
  ];
  const lineages = [
    ...report.timeline.map((item) => item.lineage_reference),
    report.state_monitor.lineage_reference,
    report.governance_panel?.lineage_reference ?? "",
    report.confidence_monitor.lineage_reference,
    report.supervision_monitor?.lineage_reference ?? "",
  ];
  const integrity = [
    ...report.timeline.map((item) => item.integrity_hash),
    report.state_monitor.integrity_hash,
    report.governance_panel?.integrity_hash ?? "",
    report.confidence_monitor.integrity_hash,
    report.supervision_monitor?.integrity_hash ?? "",
  ];
  return freezeArray([
    validationTest("operational dashboard schema present", report.visibility_contract.validation_outcome === "VALID", "DASHBOARD_STATE_NONDETERMINISTIC", evidence),
    validationTest("execution timeline operational", report.timeline.length === 13, "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("current execution displayed", report.timeline.some((item) => item.execution_state === "RUNNING"), "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("completed execution displayed", report.timeline.some((item) => item.event_type === "EXECUTION_COMPLETED"), "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("pending execution displayed", report.timeline.some((item) => item.execution_state === "WAITING"), "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("failures displayed", report.timeline.some((item) => item.event_type === "FAILURE_DETECTED"), "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("retries displayed", report.timeline.some((item) => item.event_type === "RETRY_STARTED" || item.event_type === "RETRY_COMPLETED"), "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("checkpoints displayed", report.timeline.some((item) => item.checkpoint_reference), "EXECUTION_TIMELINE_INCOMPLETE", evidence),
    validationTest("state monitor operational", Boolean(report.state_monitor.state_record_id), "DASHBOARD_STATE_NONDETERMINISTIC", evidence),
    validationTest("lifecycle states deterministic", scenario !== "NONDETERMINISTIC_STATE" && report.timeline.every((item, index) => item.step_order === index + 1), "DASHBOARD_STATE_NONDETERMINISTIC", evidence),
    validationTest("governance panel operational", Boolean(report.governance_panel), "GOVERNANCE_STATUS_MISSING", evidence),
    validationTest("governance status synchronized", report.governance_panel?.governance_status === report.mission_summary.governance_status, "GOVERNANCE_STATUS_MISSING", evidence),
    validationTest("confidence monitor operational", report.confidence_monitor.overall_confidence > 0, "CONFIDENCE_METRICS_NOT_REPRODUCIBLE", evidence),
    validationTest("confidence history reproducible", scenario !== "CONFIDENCE_NOT_REPRODUCIBLE", "CONFIDENCE_METRICS_NOT_REPRODUCIBLE", evidence),
    validationTest("confidence trend deterministic", report.confidence_monitor.trend_direction !== "VOLATILE", "CONFIDENCE_METRICS_NOT_REPRODUCIBLE", evidence),
    validationTest("risk monitor operational", report.risk_monitor.length > 0, "RISK_INDICATORS_INCONSISTENT", evidence),
    validationTest("severity indicators accurate", scenario !== "RISK_INCONSISTENT", "RISK_INDICATORS_INCONSISTENT", evidence),
    validationTest("likelihood indicators accurate", scenario !== "RISK_INCONSISTENT", "RISK_INDICATORS_INCONSISTENT", evidence),
    validationTest("impact indicators accurate", scenario !== "RISK_INCONSISTENT", "RISK_INDICATORS_INCONSISTENT", evidence),
    validationTest("mitigation recommendations displayed", report.risk_monitor.every((item) => item.mitigation.length > 0), "RISK_INDICATORS_INCONSISTENT", evidence),
    validationTest("supervision monitor operational", Boolean(report.supervision_monitor), "SUPERVISION_HEALTH_UNAVAILABLE", evidence),
    validationTest("supervision health synchronized", (report.supervision_monitor?.health_score ?? 0) > 0.5, "SUPERVISION_HEALTH_UNAVAILABLE", evidence),
    validationTest("drift detection displayed", Boolean(report.supervision_monitor?.drift_status), "SUPERVISION_HEALTH_UNAVAILABLE", evidence),
    validationTest("policy violations displayed", typeof report.supervision_monitor?.policy_violation_count === "number", "SUPERVISION_HEALTH_UNAVAILABLE", evidence),
    validationTest("replay references preserved", refs.every(Boolean), "REPLAY_REFERENCE_MISSING", evidence),
    validationTest("lineage references preserved", lineages.every(Boolean), "LINEAGE_REFERENCE_MISSING", evidence),
    validationTest("integrity hashes preserved", integrity.every(Boolean), "INTEGRITY_HASH_MISSING", evidence),
    validationTest("deterministic dashboard ordering", report.refresh_record.deterministic_refresh_order.length === 9, "DASHBOARD_STATE_NONDETERMINISTIC", evidence),
    validationTest("advisory-only behavior enforced", report.advisory_only && !report.execution_authority_granted, "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED", evidence),
    validationTest("tenant isolation enforced", report.timeline.every((item) => item.tenant_id === TENANT_ID), "CROSS_TENANT_INFORMATION_DISPLAYED", evidence),
    validationTest("hidden autonomous state rejected", scenario !== "HIDDEN_EXECUTION", "HIDDEN_EXECUTION_EXISTS", evidence),
    validationTest("unauthorized dashboard access rejected", scenario !== "UNAUTHORIZED_ACCESS", "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
  ]);
}

export function computeMissionControlOperationalDashboardHash(report: Omit<MissionControlOperationalDashboardReport, "dashboard_hash"> | MissionControlOperationalDashboardReport): string {
  const { dashboard_hash: _hash, ...source } = report as MissionControlOperationalDashboardReport;
  return hashValue("mission-control-operational-dashboard-report", source);
}

export function runMissionControlOperationalDashboard(input: MissionControlOperationalDashboardInput = {}): MissionControlOperationalDashboardReport {
  const scenario = input.scenario ?? "BASELINE";
  const visibility = runMissionControlVisibilityContract();
  const timeline = buildTimeline(scenario);
  const state = buildState(scenario);
  const governance = buildGovernance(scenario);
  const confidence = buildConfidence(scenario);
  const risks = buildRisks(scenario);
  const supervision = buildSupervision(scenario);
  const alerts = buildAlerts(scenario);
  const refresh = buildRefresh(input.refresh_mode ?? "REAL_TIME");
  const dashboard_id = id("ODB", "operational-dashboard-id", { scenario, refresh: refresh.refresh_mode });
  const summarySource = {
    mission_summary_id: id("OMS", "operational-mission-summary-id", scenario),
    mission_id: MISSION_ID,
    tenant_id: scenario === "CROSS_TENANT_DISPLAY" ? "tenant:other" : TENANT_ID,
    overall_status: "COMPLETED" as const,
    overall_health: supervision?.health_score ?? 0,
    overall_confidence: confidence.overall_confidence,
    overall_risk: risks.some((item) => item.severity === "CRITICAL") ? "CRITICAL" as const : "MODERATE" as const,
    governance_status: governance?.governance_status ?? "BLOCKED" as const,
    execution_progress: timeline.length / 13,
    active_alerts: alerts.filter((item) => item.operator_required).length,
    timestamp: NOW,
  };
  const mission_summary = Object.freeze({ ...summarySource, summary_hash: hashValue("operational-mission-summary", summarySource) });
  const base = {
    phase_version: "8J.2" as const,
    schema_version: SCHEMA_VERSION,
    dashboard_id,
    tenant_id: TENANT_ID,
    mission_id: MISSION_ID,
    visibility_contract: visibility,
    timeline,
    state_monitor: state,
    governance_panel: governance,
    confidence_monitor: confidence,
    risk_monitor: risks,
    supervision_monitor: supervision,
    mission_summary,
    alerts,
    refresh_record: refresh,
    replay_reference: REPLAY_REFERENCE,
    lineage_reference: LINEAGE_REFERENCE,
    advisory_only: true as const,
    execution_authority_granted: scenario === "EXECUTION_AUTHORITY_EXPOSED" ? true as never : false as const,
  };
  const tests = buildTests(base, scenario);
  const failures = freezeArray(tests.map((test) => test.failure_reason).filter((failure): failure is OperationalDashboardFailure => Boolean(failure)));
  const validation_outcome: OperationalDashboardValidationOutcome = failures.length === 0 ? "VALID" : "INVALID";
  const integrity_hash = scenario === "MISSING_INTEGRITY_HASH" ? "" : hashValue("operational-dashboard-integrity", { timeline: timeline.map((item) => item.event_hash), state: state.state_hash, governance: governance?.governance_hash, confidence: confidence.confidence_hash, risks: risks.map((item) => item.risk_hash), supervision: supervision?.supervision_hash, summary: mission_summary.summary_hash, alerts: alerts.map((item) => item.alert_hash), refresh: refresh.refresh_hash });
  const report = { ...base, validation_outcome, validation_tests: tests, failures, integrity_hash };
  return Object.freeze({ ...report, dashboard_hash: computeMissionControlOperationalDashboardHash(report as MissionControlOperationalDashboardReport) });
}

export function validateMissionControlOperationalDashboard(report?: MissionControlOperationalDashboardReport): MissionControlOperationalDashboardValidationResult {
  if (!report) {
    const failures = freezeArray<OperationalDashboardFailure>(["DASHBOARD_STATE_NONDETERMINISTIC"]);
    const source = { dashboard_id: null, valid: false, validation_outcome: "INVALID" as const, failures, dashboard_hash_valid: false, advisory_only: false };
    return Object.freeze({ ...source, validation_hash: hashValue("operational-dashboard-validation", source) });
  }
  const dashboard_hash_valid = computeMissionControlOperationalDashboardHash(report) === report.dashboard_hash;
  const valid = report.validation_outcome === "VALID" && dashboard_hash_valid && report.advisory_only && !report.execution_authority_granted;
  const source = { dashboard_id: report.dashboard_id, valid, validation_outcome: report.validation_outcome, failures: report.failures, dashboard_hash_valid, advisory_only: report.advisory_only && !report.execution_authority_granted };
  return Object.freeze({ ...source, validation_hash: hashValue("operational-dashboard-validation", source) });
}

export function buildMissionControlOperationalDashboardObservabilitySurface(report = runMissionControlOperationalDashboard()): MissionControlOperationalDashboardObservabilitySurface {
  return Object.freeze({
    dashboard_id: report.dashboard_id,
    validation_outcome: report.validation_outcome,
    timeline_events: report.timeline.length,
    current_state: report.state_monitor.current_state,
    governance_status: report.governance_panel?.governance_status ?? null,
    confidence: report.confidence_monitor.overall_confidence,
    active_risks: report.risk_monitor.length,
    supervision_state: report.supervision_monitor?.supervision_state ?? null,
    active_alerts: report.alerts.filter((item) => item.operator_required).length,
    failed_tests: report.validation_tests.filter((test) => !test.passed).length,
    failures: report.failures,
    advisory_only: report.advisory_only,
    execution_authority_granted: report.execution_authority_granted,
    dashboard_hash: report.dashboard_hash,
  });
}

export function getMissionControlOperationalDashboardContract() {
  const report = runMissionControlOperationalDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only-visibility", "deterministic-display", "replay-consistency", "governance-first", "operator-supremacy", "tenant-isolation", "explainability", "advisory-only"]),
      schema_version: SCHEMA_VERSION,
      timeline_event_types: freezeArray(["MISSION_CREATED", "PLAN_GENERATED", "EXECUTION_STARTED", "TASK_STARTED", "TASK_COMPLETED", "CHECKPOINT_CREATED", "RETRY_STARTED", "RETRY_COMPLETED", "FAILURE_DETECTED", "ROLLBACK_STARTED", "ROLLBACK_COMPLETED", "EXECUTION_COMPLETED", "MISSION_COMPLETED"] as const),
      execution_states: freezeArray(["PLANNING", "READY", "RUNNING", "WAITING", "PAUSED", "INTERVENED", "COMPLETED", "FAILED", "ROLLED_BACK"] as const),
      refresh_modes: freezeArray(["REAL_TIME", "EVENT_DRIVEN", "REPLAY_MODE", "SNAPSHOT_MODE"] as const),
      no_execution_authority: true,
    }),
    report,
    validation: validateMissionControlOperationalDashboard(report),
    observability: buildMissionControlOperationalDashboardObservabilitySurface(report),
  });
}
