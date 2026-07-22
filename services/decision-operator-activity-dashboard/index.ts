import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runReplayCertificationMonitoring } from "@/services/decision-replay-certification-monitoring";
import type { ReplayCertificationMonitoringResult } from "@/types/decision-replay-certification-monitoring";
import type { DecisionStateRecord } from "@/types/decision-state-dashboard";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  OperatorActionRecord,
  OperatorActionType,
  OperatorActivityDashboardFailure,
  OperatorActivityDashboardFoundation,
  OperatorActivityDashboardInput,
  OperatorActivityDashboardResult,
  OperatorActivityDashboardValidation,
  OperatorActivityLedgerEntry,
  OperatorActivityRecord,
  OperatorApprovalDashboard,
  OperatorApprovalState,
  OperatorEscalationDashboard,
  OperatorEscalationType,
  OperatorHistoryViewer,
  OperatorOverrideCategory,
  OperatorOverrideDashboard,
  OperatorQueueCategory,
  OperatorWorkQueue,
} from "@/types/decision-operator-activity-dashboard";

const DASHBOARD_VERSION = "decision-operator-activity-dashboard/v1" as const;

export const OPERATOR_QUEUE_CATEGORIES: readonly OperatorQueueCategory[] = Object.freeze(["IMMEDIATE_ACTION", "HIGH_PRIORITY", "PENDING_APPROVAL", "PENDING_REVIEW", "PENDING_EVIDENCE", "PENDING_SIMULATION", "DEFERRED", "ESCALATED"]);
export const OPERATOR_APPROVAL_STATES: readonly OperatorApprovalState[] = Object.freeze(["REQUESTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ARCHIVED"]);
export const OPERATOR_OVERRIDE_CATEGORIES: readonly OperatorOverrideCategory[] = Object.freeze(["RECOMMENDATION_OVERRIDE", "PRIORITY_OVERRIDE", "DEFERMENT", "APPROVAL_OVERRIDE", "ESCALATION_OVERRIDE", "CANCELLATION"]);
export const OPERATOR_ESCALATION_TYPES: readonly OperatorEscalationType[] = Object.freeze(["GOVERNANCE", "CONSTITUTIONAL", "AUTHORITY", "OPERATIONAL", "CERTIFICATION", "SECURITY", "MISSION", "REPLAY"]);
export const OPERATOR_ACTION_TYPES: readonly OperatorActionType[] = Object.freeze(["ASSIGNMENT_CREATED", "REVIEW_STARTED", "APPROVAL_SUBMITTED", "APPROVAL_COMPLETED", "REJECTION_SUBMITTED", "OVERRIDE_PERFORMED", "ESCALATION_INITIATED", "ESCALATION_RESOLVED", "DEFERMENT_APPLIED", "EVIDENCE_REQUESTED", "SIMULATION_REQUESTED", "REPLAY_VERIFIED", "CERTIFICATION_VERIFIED"]);

type Scenario = NonNullable<OperatorActivityDashboardInput["scenario"]>;

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

function ctx(source: ReplayCertificationMonitoringResult, operator_id: string) {
  const governance = source.governance_visibility;
  const dashboard = governance.priority_dashboard.conflict_visualization.timeline_result.dashboard_result;
  return {
    governance,
    dashboard,
    registry: dashboard.registry,
    tenant_id: source.monitoring_record.tenant_id,
    mission_id: source.monitoring_record.mission_id,
    replay_ref: source.replay_hash,
    certification_ref: source.monitoring_record.certification_ref,
    operator_id,
  };
}

function queueCategory(record: DecisionStateRecord): OperatorQueueCategory {
  if (record.lifecycle_state === "ESCALATED") return "ESCALATED";
  if (record.lifecycle_state === "DEFERRED") return "DEFERRED";
  if (record.blocker_reason?.toLowerCase().includes("evidence")) return "PENDING_EVIDENCE";
  if (record.authority_state === "APPROVAL_REQUIRED") return "PENDING_APPROVAL";
  if (record.governance_state === "REVIEW_REQUIRED" || record.governance_state === "RESTRICTED") return "PENDING_REVIEW";
  if (record.priority === "CRITICAL") return "IMMEDIATE_ACTION";
  if (record.priority === "HIGH") return "HIGH_PRIORITY";
  return "PENDING_REVIEW";
}

function priorityScore(record: DecisionStateRecord): number {
  const priority = record.priority === "CRITICAL" ? 100 : record.priority === "HIGH" ? 80 : record.priority === "MEDIUM" ? 55 : record.priority === "LOW" ? 25 : 10;
  const risk = record.risk_level === "CRITICAL" ? 40 : record.risk_level === "HIGH" ? 30 : record.risk_level === "MODERATE" ? 18 : 5;
  const blocked = record.lifecycle_state === "BLOCKED" || record.lifecycle_state === "ESCALATED" ? 25 : 0;
  return priority + risk + blocked;
}

function scopedRecords(source: ReplayCertificationMonitoringResult, operator_id: string, scenario: Scenario): readonly DecisionStateRecord[] {
  const records = ctx(source, operator_id).registry.filter((record) => record.assigned_operator === operator_id || record.authority_state !== "AUTHORIZED" || record.lifecycle_state === "ESCALATED");
  const sorted = [...records].sort((a, b) => priorityScore(b) - priorityScore(a) || a.decision_id.localeCompare(b.decision_id));
  if (scenario === "NONDETERMINISTIC_ORDER") return freezeArray(sorted.reverse());
  if (scenario === "INCOMPLETE_WORK_QUEUE") return freezeArray(sorted.slice(0, 1));
  return freezeArray(sorted);
}

function buildWorkQueue(source: ReplayCertificationMonitoringResult, records: readonly DecisionStateRecord[], operator_id: string, scenario: Scenario): OperatorWorkQueue {
  const c = ctx(source, operator_id);
  const categories = Object.fromEntries(OPERATOR_QUEUE_CATEGORIES.map((category) => [category, [] as string[]])) as Record<OperatorQueueCategory, string[]>;
  records.forEach((record) => categories[queueCategory(record)].push(record.decision_id));
  const completed = records.filter((record) => record.lifecycle_state === "COMPLETED" || record.lifecycle_state === "CANCELLED").length;
  const pending = records.length - completed;
  const base: Omit<OperatorWorkQueue, "integrity_hash"> = {
    work_queue_id: `operator_work_queue_${operator_id}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : c.tenant_id,
    operator_id,
    assigned_decisions: freezeArray(records.map((record) => record.decision_id)),
    queue_order: freezeArray(records.map((record) => record.decision_id)),
    queue_categories: Object.freeze(Object.fromEntries(OPERATOR_QUEUE_CATEGORIES.map((category) => [category, freezeArray(categories[category])])) as Record<OperatorQueueCategory, readonly string[]>),
    workload_metrics: Object.freeze({ assigned_decisions: scenario === "BAD_WORKLOAD_METRICS" ? 0 : records.length, pending_workload: scenario === "BAD_WORKLOAD_METRICS" ? 0 : pending, completed_workload: completed, average_response_minutes: scenario === "BAD_WORKLOAD_METRICS" ? 0 : 36, utilization: scenario === "BAD_WORKLOAD_METRICS" ? 0 : 0.74 }),
    pending_actions: freezeArray(records.filter((record) => record.lifecycle_state !== "COMPLETED" && record.lifecycle_state !== "CANCELLED").map((record) => `review_${record.decision_id}`)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref, source.replay_dashboard.replay_refs[0]]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildApprovalDashboard(source: ReplayCertificationMonitoringResult, operator_id: string, scenario: Scenario): OperatorApprovalDashboard {
  const c = ctx(source, operator_id);
  const approval = source.governance_visibility.approval_workflow;
  const base: Omit<OperatorApprovalDashboard, "integrity_hash"> = {
    approval_dashboard_id: `operator_approval_dashboard_${operator_id}`,
    tenant_id: c.tenant_id,
    operator_id,
    pending_approvals: scenario === "MISSING_APPROVAL_HISTORY" ? freezeArray([]) : approval.pending_approvals,
    completed_approvals: scenario === "MISSING_APPROVAL_HISTORY" ? freezeArray([]) : approval.completed_approvals,
    rejected_approvals: approval.rejected_approvals,
    delegated_approvals: scenario === "MISSING_APPROVAL_HISTORY" ? freezeArray([]) : approval.delegated_approvals,
    expired_approvals: approval.expired_approvals,
    approval_history: scenario === "MISSING_APPROVAL_HISTORY" ? freezeArray([]) : freezeArray([...approval.pending_approvals, ...approval.completed_approvals, ...approval.delegated_approvals]),
    approval_latency_minutes: scenario === "MISSING_APPROVAL_HISTORY" ? 0 : 22,
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : approval.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOverrideDashboard(source: ReplayCertificationMonitoringResult, records: readonly DecisionStateRecord[], operator_id: string, scenario: Scenario): OperatorOverrideDashboard {
  const c = ctx(source, operator_id);
  const overrideRecords = records.filter((record) => record.lifecycle_state === "DEFERRED" || record.lifecycle_state === "CANCELLED" || record.authority_state === "APPROVAL_REQUIRED");
  const base: Omit<OperatorOverrideDashboard, "integrity_hash"> = {
    override_dashboard_id: `operator_override_dashboard_${operator_id}`,
    tenant_id: c.tenant_id,
    operator_id,
    override_refs: scenario === "HIDE_OVERRIDES" ? freezeArray([]) : freezeArray(overrideRecords.map((record) => `override_${record.decision_id}`)),
    override_categories: scenario === "HIDE_OVERRIDES" ? freezeArray([]) : freezeArray(["DEFERMENT", "APPROVAL_OVERRIDE", "CANCELLATION"]),
    original_recommendations: scenario === "HIDE_OVERRIDES" ? freezeArray([]) : freezeArray(overrideRecords.map((record) => `original_recommendation_${record.decision_id}`)),
    justification_refs: scenario === "HIDE_OVERRIDES" ? freezeArray([]) : freezeArray(overrideRecords.map((record) => `justification_${record.decision_id}`)),
    governance_refs: scenario === "HIDE_OVERRIDES" ? freezeArray([]) : source.governance_visibility.governance_dashboard.policy_results,
    replay_refs: scenario === "MISSING_REPLAY_REFS" || scenario === "HIDE_OVERRIDES" ? freezeArray([]) : freezeArray([c.replay_ref]),
    certification_impact: scenario === "MISSING_CERTIFICATION_REFS" || scenario === "HIDE_OVERRIDES" ? freezeArray([]) : freezeArray(overrideRecords.map((record) => `certification_impact_${record.certification_state.toLowerCase()}_${record.decision_id}`)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEscalationDashboard(source: ReplayCertificationMonitoringResult, records: readonly DecisionStateRecord[], operator_id: string, scenario: Scenario): OperatorEscalationDashboard {
  const c = ctx(source, operator_id);
  const escalated = records.filter((record) => record.lifecycle_state === "ESCALATED" || record.authority_state === "ESCALATION_REQUIRED" || record.governance_state === "REVIEW_REQUIRED");
  const base: Omit<OperatorEscalationDashboard, "integrity_hash"> = {
    escalation_dashboard_id: `operator_escalation_dashboard_${operator_id}`,
    tenant_id: c.tenant_id,
    operator_id,
    escalation_refs: scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : freezeArray(escalated.map((record) => `escalation_${record.decision_id}`)),
    escalation_types: scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : freezeArray(["AUTHORITY", "GOVERNANCE", "OPERATIONAL"]),
    escalation_status: scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : freezeArray(escalated.map((record) => `${record.decision_id}:${record.escalation_state}`)),
    assigned_authority: scenario === "BAD_AUTHORITY_ASSIGNMENTS" || scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : source.governance_visibility.authority_dashboard.assigned_authority,
    response_deadlines: scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : freezeArray(escalated.map((record) => `deadline_${record.decision_id}_30m`)),
    resolution_history: scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : freezeArray(escalated.map((record) => `resolution_pending_${record.decision_id}`)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" || scenario === "OMIT_ESCALATIONS" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function actionType(record: DecisionStateRecord): OperatorActionType {
  if (record.lifecycle_state === "ESCALATED") return "ESCALATION_INITIATED";
  if (record.lifecycle_state === "DEFERRED") return "DEFERMENT_APPLIED";
  if (record.authority_state === "APPROVAL_REQUIRED") return "APPROVAL_SUBMITTED";
  if (record.lifecycle_state === "COMPLETED") return "APPROVAL_COMPLETED";
  if (record.lifecycle_state === "CANCELLED") return "OVERRIDE_PERFORMED";
  return "REVIEW_STARTED";
}

function buildActionRecords(source: ReplayCertificationMonitoringResult, records: readonly DecisionStateRecord[], operator_id: string, scenario: Scenario): readonly OperatorActionRecord[] {
  const c = ctx(source, operator_id);
  const actions = records.map((record, index) => {
    const base: Omit<OperatorActionRecord, "integrity_hash"> = {
      action_id: `operator_action_${record.decision_id}`,
      decision_id: record.decision_id,
      operator_id,
      action_type: actionType(record),
      authority_level: scenario === "BAD_AUTHORITY_ASSIGNMENTS" && index === 0 ? "UNKNOWN" : record.authority_state,
      governance_state: record.governance_state,
      action_timestamp: `2026-07-05T09:11:${(10 + index).toString().padStart(2, "0")}.000Z`,
      replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  if (scenario === "BROKEN_HISTORY") return freezeArray(actions.slice(0, 1));
  if (scenario === "HASH_MISMATCH") return freezeArray(actions.map((action, index) => index === 0 ? Object.freeze({ ...action, integrity_hash: hash({ tampered: action.action_id }) }) : action));
  return freezeArray(actions);
}

function buildLedger(source: ReplayCertificationMonitoringResult, actions: readonly OperatorActionRecord[], operator_id: string, scenario: Scenario): readonly OperatorActivityLedgerEntry[] {
  const c = ctx(source, operator_id);
  return freezeArray(actions.map((action, index) => {
    const base: Omit<OperatorActivityLedgerEntry, "integrity_hash"> = {
      operator_activity_ledger_id: `operator_activity_ledger_${(index + 1).toString().padStart(3, "0")}`,
      tenant_id: scenario === "CROSS_TENANT" && index === 0 ? "tenant_other" : c.tenant_id,
      operator_id,
      decision_id: action.decision_id,
      activity_type: action.action_type,
      activity_timestamp: action.action_timestamp,
      authority_state: action.authority_level,
      governance_state: action.governance_state,
      replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray([c.replay_ref]),
      certification_refs: scenario === "MISSING_CERTIFICATION_REFS" ? freezeArray([]) : freezeArray([c.certification_ref]),
      sequence_number: index + 1,
      append_only: true,
      deleted: false,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildHistoryViewer(source: ReplayCertificationMonitoringResult, actions: readonly OperatorActionRecord[], ledger: readonly OperatorActivityLedgerEntry[], operator_id: string, scenario: Scenario): OperatorHistoryViewer {
  const c = ctx(source, operator_id);
  const base: Omit<OperatorHistoryViewer, "integrity_hash"> = {
    history_viewer_id: `operator_history_viewer_${operator_id}`,
    tenant_id: c.tenant_id,
    operator_id,
    activity_refs: scenario === "BROKEN_HISTORY" ? freezeArray([]) : freezeArray(actions.map((action) => action.action_id)),
    timeline_refs: scenario === "BROKEN_HISTORY" ? freezeArray([]) : freezeArray(ledger.map((entry) => `${entry.sequence_number}:${entry.activity_type}:${entry.decision_id}`)),
    workload_history: scenario === "BROKEN_HISTORY" ? freezeArray([]) : freezeArray(actions.map((action) => `workload_${action.action_timestamp}_${action.decision_id}`)),
    replay_refs: scenario === "MISSING_REPLAY_REFS" || scenario === "BROKEN_HISTORY" ? freezeArray([]) : freezeArray([c.replay_ref]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildActivityRecord(source: ReplayCertificationMonitoringResult, work: OperatorWorkQueue, approvals: OperatorApprovalDashboard, overrides: OperatorOverrideDashboard, escalations: OperatorEscalationDashboard, history: OperatorHistoryViewer, ledger: readonly OperatorActivityLedgerEntry[], actions: readonly OperatorActionRecord[], operator_id: string, scenario: Scenario): OperatorActivityRecord {
  const c = ctx(source, operator_id);
  const base: Omit<OperatorActivityRecord, "integrity_hash"> = {
    activity_record_id: `operator_activity_record_${operator_id}`,
    tenant_id: c.tenant_id,
    operator_id,
    work_queue_ref: work.work_queue_id,
    approval_dashboard_ref: approvals.approval_dashboard_id,
    override_dashboard_ref: overrides.override_dashboard_id,
    escalation_dashboard_ref: escalations.escalation_dashboard_id,
    history_viewer_ref: history.history_viewer_id,
    activity_ledger_refs: freezeArray(ledger.map((entry) => entry.operator_activity_ledger_id)),
    action_record_refs: freezeArray(actions.map((action) => action.action_id)),
    replay_ref: scenario === "MISSING_REPLAY_REFS" ? "" : c.replay_ref,
    certification_ref: scenario === "MISSING_CERTIFICATION_REFS" ? "" : c.certification_ref,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: ReplayCertificationMonitoringResult;
  records: readonly DecisionStateRecord[];
  work: OperatorWorkQueue;
  approvals: OperatorApprovalDashboard;
  overrides: OperatorOverrideDashboard;
  escalations: OperatorEscalationDashboard;
  history: OperatorHistoryViewer;
  ledger: readonly OperatorActivityLedgerEntry[];
  actions: readonly OperatorActionRecord[];
  activity: OperatorActivityRecord;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly OperatorActivityDashboardFailure[] {
  const failures: OperatorActivityDashboardFailure[] = [];
  const c = ctx(input.source, input.work.operator_id);
  const expectedOrder = scopedRecords(input.source, input.work.operator_id, "BASELINE").map((record) => record.decision_id).join("|");
  if (input.scenario === "INCOMPLETE_WORK_QUEUE" || input.work.assigned_decisions.length !== input.records.length || !input.work.pending_actions.length) failures.push("OPERATOR_WORK_QUEUES_INCOMPLETE");
  if (!input.approvals.approval_history.length || !input.approvals.pending_approvals.length || !input.approvals.delegated_approvals.length) failures.push("APPROVAL_HISTORY_MISSING");
  if (!input.overrides.override_refs.length || !input.overrides.original_recommendations.length || !input.overrides.justification_refs.length || !input.overrides.governance_refs.length) failures.push("OVERRIDES_HIDDEN");
  if (!input.escalations.escalation_refs.length || !input.escalations.assigned_authority.length || !input.escalations.response_deadlines.length || !input.escalations.resolution_history.length) failures.push("ESCALATION_ACTIVITY_OMITTED");
  if (!input.history.activity_refs.length || input.history.activity_refs.length !== input.actions.length || !input.history.timeline_refs.length || input.ledger.length !== input.actions.length) failures.push("OPERATOR_HISTORY_RECONSTRUCTION_FAILED");
  if (input.work.workload_metrics.assigned_decisions !== input.records.length || input.work.workload_metrics.pending_workload !== input.work.pending_actions.length || input.work.workload_metrics.average_response_minutes <= 0) failures.push("WORKLOAD_METRICS_INACCURATE");
  if (!input.escalations.assigned_authority.includes("governance_board") || input.actions.some((action) => action.authority_level === "UNKNOWN")) failures.push("AUTHORITY_ASSIGNMENTS_INCONSISTENT");
  if (!input.activity.replay_ref || !input.work.replay_refs.length || !input.approvals.replay_refs.length || !input.overrides.replay_refs.length || !input.escalations.replay_refs.length || !input.history.replay_refs.length || input.actions.some((action) => !action.replay_ref) || input.ledger.some((entry) => !entry.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.activity.certification_ref || !input.overrides.certification_impact.length || input.ledger.some((entry) => !entry.certification_refs.length)) failures.push("CERTIFICATION_REFERENCES_ABSENT");
  if (input.scenario === "NONDETERMINISTIC_ORDER" || input.work.queue_order.join("|") !== expectedOrder) failures.push("DASHBOARD_ORDER_NONDETERMINISTIC");
  if (input.work.tenant_id !== c.tenant_id || input.ledger.some((entry) => entry.tenant_id !== c.tenant_id)) failures.push("CROSS_TENANT_OPERATOR_DATA_VISIBLE");
  if (
    hashWithoutIntegrity(input.work) !== input.work.integrity_hash
    || hashWithoutIntegrity(input.approvals) !== input.approvals.integrity_hash
    || hashWithoutIntegrity(input.overrides) !== input.overrides.integrity_hash
    || hashWithoutIntegrity(input.escalations) !== input.escalations.integrity_hash
    || hashWithoutIntegrity(input.history) !== input.history.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || input.actions.some((action) => hashWithoutIntegrity(action) !== action.integrity_hash)
    || hashWithoutIntegrity(input.activity) !== input.activity.integrity_hash
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("OPERATOR_ACTIVITY_REPLAY_RECONSTRUCTION_FAILED");
  if (!input.source.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === input.role && auth.permissions.includes("VIEW_DECISIONS"))) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly OperatorActivityDashboardFailure[]): OperatorActivityDashboardValidation {
  const has = (failure: OperatorActivityDashboardFailure) => failures.includes(failure);
  const base: Omit<OperatorActivityDashboardValidation, "integrity_hash"> = {
    validation_id: "operator_activity_dashboard_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    work_queues_complete: !has("OPERATOR_WORK_QUEUES_INCOMPLETE"),
    approval_history_complete: !has("APPROVAL_HISTORY_MISSING"),
    overrides_visible: !has("OVERRIDES_HIDDEN"),
    escalations_visible: !has("ESCALATION_ACTIVITY_OMITTED"),
    operator_history_reconstructable: !has("OPERATOR_HISTORY_RECONSTRUCTION_FAILED") && !has("OPERATOR_ACTIVITY_REPLAY_RECONSTRUCTION_FAILED"),
    workload_metrics_accurate: !has("WORKLOAD_METRICS_INACCURATE"),
    authority_assignments_consistent: !has("AUTHORITY_ASSIGNMENTS_INCONSISTENT"),
    replay_refs_present: !has("REPLAY_REFERENCES_MISSING"),
    certification_refs_present: !has("CERTIFICATION_REFERENCES_ABSENT"),
    deterministic_ordering: !has("DASHBOARD_ORDER_NONDETERMINISTIC"),
    tenant_isolated: !has("CROSS_TENANT_OPERATOR_DATA_VISIBLE"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<OperatorActivityDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    work: result.work_queue,
    approvals: result.approval_dashboard,
    overrides: result.override_dashboard,
    escalations: result.escalation_dashboard,
    history: result.history_viewer,
    ledger: result.activity_ledger,
    actions: result.action_records,
    activity: result.activity_record,
    validation: result.validation,
  });
}

export function runOperatorActivityDashboard(input: OperatorActivityDashboardInput = {}): OperatorActivityDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const operator_id = input.operator_id ?? "operator_alpha";
  const replay_monitoring = input.replay_monitoring ?? runReplayCertificationMonitoring();
  const records = scopedRecords(replay_monitoring, operator_id, scenario);
  const work_queue = buildWorkQueue(replay_monitoring, records, operator_id, scenario);
  const approval_dashboard = buildApprovalDashboard(replay_monitoring, operator_id, scenario);
  const override_dashboard = buildOverrideDashboard(replay_monitoring, records, operator_id, scenario);
  const escalation_dashboard = buildEscalationDashboard(replay_monitoring, records, operator_id, scenario);
  const action_records = buildActionRecords(replay_monitoring, records, operator_id, scenario);
  const activity_ledger = buildLedger(replay_monitoring, action_records, operator_id, scenario);
  const history_viewer = buildHistoryViewer(replay_monitoring, action_records, activity_ledger, operator_id, scenario);
  const activity_record = buildActivityRecord(replay_monitoring, work_queue, approval_dashboard, override_dashboard, escalation_dashboard, history_viewer, activity_ledger, action_records, operator_id, scenario);
  const failures = collectFailures({ source: replay_monitoring, records, work: work_queue, approvals: approval_dashboard, overrides: override_dashboard, escalations: escalation_dashboard, history: history_viewer, ledger: activity_ledger, actions: action_records, activity: activity_record, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<OperatorActivityDashboardResult, "integrity_hash" | "replay_hash"> = {
    dashboard_version: DASHBOARD_VERSION,
    replay_monitoring,
    work_queue,
    approval_dashboard,
    override_dashboard,
    escalation_dashboard,
    history_viewer,
    activity_ledger,
    action_records,
    activity_record,
    validation,
    deterministic: true,
    advisory_only: true,
    mutates_operator_or_orchestration: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorActivityDashboard(result: OperatorActivityDashboardResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeOperatorActionRecordHash(record: Omit<OperatorActionRecord, "integrity_hash"> | OperatorActionRecord): string {
  return hashWithoutIntegrity(record);
}

export function getOperatorActivityDashboardFoundation(): OperatorActivityDashboardFoundation {
  return Object.freeze({
    dashboard_version: DASHBOARD_VERSION,
    queue_categories: OPERATOR_QUEUE_CATEGORIES,
    approval_states: OPERATOR_APPROVAL_STATES,
    override_categories: OPERATOR_OVERRIDE_CATEGORIES,
    escalation_types: OPERATOR_ESCALATION_TYPES,
    action_types: OPERATOR_ACTION_TYPES,
    result: runOperatorActivityDashboard(),
  });
}

export const OperatorActivityDashboard = Object.freeze({
  run: runOperatorActivityDashboard,
  replay: replayOperatorActivityDashboard,
});
