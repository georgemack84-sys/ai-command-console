import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runWorkflowAuditReplay } from "@/services/workflow-audit-replay";
import type {
  DashboardSection,
  DashboardStatusApiResponse,
  DashboardViewModel,
  GovernanceSummaryView,
  OperatorActivityView,
  OperatorVisibilityDashboardFailureReason,
  OperatorVisibilityDashboardFoundation,
  OperatorVisibilityDashboardInput,
  OperatorVisibilityDashboardObservability,
  OperatorVisibilityDashboardReplay,
  OperatorVisibilityDashboardResult,
  OperatorVisibilityDashboardValidation,
  RecommendationSummaryView,
  ReplaySummaryView,
  WorkflowStatusView,
  WorkflowTimelineView,
} from "@/types/operator-visibility-dashboard";
import type { WorkflowAuditEvent, WorkflowAuditReplayResult } from "@/types/workflow-audit-replay";

const DASHBOARD_VERSION = "operator-visibility-dashboard/v1" as const;
const NOW = "2026-07-05T00:24:00.000Z";

export const DASHBOARD_SECTIONS: readonly DashboardSection[] = Object.freeze(["WORKFLOW_STATUS", "RECOMMENDATION_SUMMARY", "GOVERNANCE", "OPERATOR_ACTIVITY", "REPLAY", "WORKFLOW_TIMELINE"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function statusHash(record: Omit<WorkflowStatusView, "integrity_hash"> | WorkflowStatusView): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowStatusViewHash(record: Omit<WorkflowStatusView, "integrity_hash"> | WorkflowStatusView): string {
  return statusHash(record);
}

function recommendationHash(record: Omit<RecommendationSummaryView, "integrity_hash"> | RecommendationSummaryView): string {
  return hashWithoutIntegrity(record);
}

export function computeRecommendationSummaryViewHash(record: Omit<RecommendationSummaryView, "integrity_hash"> | RecommendationSummaryView): string {
  return recommendationHash(record);
}

function governanceHash(record: Omit<GovernanceSummaryView, "integrity_hash"> | GovernanceSummaryView): string {
  return hashWithoutIntegrity(record);
}

export function computeGovernanceSummaryViewHash(record: Omit<GovernanceSummaryView, "integrity_hash"> | GovernanceSummaryView): string {
  return governanceHash(record);
}

function activityHash(record: Omit<OperatorActivityView, "integrity_hash"> | OperatorActivityView): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorActivityViewHash(record: Omit<OperatorActivityView, "integrity_hash"> | OperatorActivityView): string {
  return activityHash(record);
}

function replaySummaryHash(record: Omit<ReplaySummaryView, "integrity_hash"> | ReplaySummaryView): string {
  return hashWithoutIntegrity(record);
}

export function computeReplaySummaryViewHash(record: Omit<ReplaySummaryView, "integrity_hash"> | ReplaySummaryView): string {
  return replaySummaryHash(record);
}

function timelineHash(record: Omit<WorkflowTimelineView, "integrity_hash"> | WorkflowTimelineView): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowTimelineViewHash(record: Omit<WorkflowTimelineView, "integrity_hash"> | WorkflowTimelineView): string {
  return timelineHash(record);
}

function dashboardHash(record: Omit<DashboardViewModel, "integrity_hash"> | DashboardViewModel): string {
  return hashWithoutIntegrity(record);
}

export function computeDashboardViewModelHash(record: Omit<DashboardViewModel, "integrity_hash"> | DashboardViewModel): string {
  return dashboardHash(record);
}

function apiHash(record: Omit<DashboardStatusApiResponse, "integrity_hash"> | DashboardStatusApiResponse): string {
  return hashWithoutIntegrity(record);
}

function validationHash(record: Omit<OperatorVisibilityDashboardValidation, "integrity_hash"> | OperatorVisibilityDashboardValidation): string {
  return hashWithoutIntegrity(record);
}

function eventsByType(audit: WorkflowAuditReplayResult, type: string): readonly WorkflowAuditEvent[] {
  return Object.freeze(audit.audit_events.filter((event) => event.event_type === type));
}

export function createWorkflowStatusView(audit: WorkflowAuditReplayResult = runWorkflowAuditReplay()): WorkflowStatusView {
  const blockers = audit.failures.length > 0 ? audit.failures : [];
  const base: Omit<WorkflowStatusView, "integrity_hash"> = {
    workflow_id: audit.timeline_record.workflow_id,
    current_state: audit.replay_record.reconstructed_state,
    time_in_state: "0ms deterministic snapshot",
    pending_actions: audit.audit_replay_status === "PASS" ? Object.freeze([]) : Object.freeze(["resolve audit failures"]),
    blocking_conditions: Object.freeze(blockers),
    replay_ref: audit.replay_record.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: statusHash(base) });
}

export function createRecommendationSummaryView(audit: WorkflowAuditReplayResult = runWorkflowAuditReplay()): RecommendationSummaryView {
  const packageEvent = eventsByType(audit, "PACKAGE_PRESENTATION")[0];
  const approvalEvent = eventsByType(audit, "OPERATOR_APPROVAL")[0];
  const base: Omit<RecommendationSummaryView, "integrity_hash"> = {
    workflow_id: audit.timeline_record.workflow_id,
    recommended_decision: packageEvent?.event_summary ?? "",
    alternatives: Object.freeze(["operator override path visible", "review request path visible", "escalation path visible"]),
    risks: Object.freeze(audit.failures.length > 0 ? audit.failures : ["no audit blockers detected"]),
    confidence: approvalEvent ? "HIGH" : "UNKNOWN",
  };
  return Object.freeze({ ...base, integrity_hash: recommendationHash(base) });
}

export function createGovernanceSummaryView(audit: WorkflowAuditReplayResult = runWorkflowAuditReplay()): GovernanceSummaryView {
  const governance = eventsByType(audit, "GOVERNANCE_VALIDATION")[0];
  const constitutional = eventsByType(audit, "CONSTITUTIONAL_VALIDATION")[0];
  const authority = eventsByType(audit, "AUTHORITY_VALIDATION")[0];
  const base: Omit<GovernanceSummaryView, "integrity_hash"> = {
    workflow_id: audit.timeline_record.workflow_id,
    policy_status: governance ? "VISIBLE" : "MISSING",
    constitutional_status: constitutional ? "VISIBLE" : "MISSING",
    authority_required: authority?.triggering_authority ?? "",
    certifications: Object.freeze(["decision package certification", "workflow audit certification"]),
  };
  return Object.freeze({ ...base, integrity_hash: governanceHash(base) });
}

export function createOperatorActivityView(audit: WorkflowAuditReplayResult = runWorkflowAuditReplay()): OperatorActivityView {
  const base: Omit<OperatorActivityView, "integrity_hash"> = {
    workflow_id: audit.timeline_record.workflow_id,
    approvals: Object.freeze(eventsByType(audit, "OPERATOR_APPROVAL").map((event) => event.event_id)),
    rejections: Object.freeze(eventsByType(audit, "OPERATOR_REJECTION").map((event) => event.event_id)),
    deferrals: Object.freeze(audit.audit_events.filter((event) => event.workflow_state === "DEFERRED").map((event) => event.event_id)),
    overrides: Object.freeze(eventsByType(audit, "OPERATOR_OVERRIDE").map((event) => event.event_id)),
    escalations: Object.freeze(eventsByType(audit, "ESCALATION").map((event) => event.event_id)),
    timeline_ref: audit.timeline_record.timeline_id,
  };
  return Object.freeze({ ...base, integrity_hash: activityHash(base) });
}

export function createReplaySummaryView(audit: WorkflowAuditReplayResult = runWorkflowAuditReplay()): ReplaySummaryView {
  const base: Omit<ReplaySummaryView, "integrity_hash"> = {
    workflow_id: audit.timeline_record.workflow_id,
    replay_status: audit.replay_record.replay_status,
    reconstructed_state: audit.replay_record.reconstructed_state,
    replay_event_count: audit.timeline_record.event_count,
    replay_ref: audit.replay_record.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: replaySummaryHash(base) });
}

export function createWorkflowTimelineView(audit: WorkflowAuditReplayResult = runWorkflowAuditReplay()): WorkflowTimelineView {
  const base: Omit<WorkflowTimelineView, "integrity_hash"> = {
    workflow_id: audit.timeline_record.workflow_id,
    ordered_events: audit.timeline_record.ordered_events,
    evidence_chain: Object.freeze(audit.audit_events.map((event) => `${event.event_id}:${event.replay_ref}`)),
    lineage_chain: Object.freeze(audit.audit_events.map((event) => `${event.event_id}:${event.lineage_ref}`)),
    replay_ref: audit.timeline_record.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: timelineHash(base) });
}

export function createDashboardViewModel(
  audit: WorkflowAuditReplayResult = runWorkflowAuditReplay(),
  workflowStatus: WorkflowStatusView = createWorkflowStatusView(audit),
  recommendation: RecommendationSummaryView = createRecommendationSummaryView(audit),
  governance: GovernanceSummaryView = createGovernanceSummaryView(audit),
  activity: OperatorActivityView = createOperatorActivityView(audit),
  replay: ReplaySummaryView = createReplaySummaryView(audit),
  timeline: WorkflowTimelineView = createWorkflowTimelineView(audit),
): DashboardViewModel {
  const base: Omit<DashboardViewModel, "integrity_hash"> = {
    dashboard_id: `operator_visibility_dashboard_${audit.timeline_record.workflow_id}`,
    workflow_id: audit.timeline_record.workflow_id,
    tenant_id: audit.escalation_result.escalation_request.tenant_id,
    current_state: workflowStatus.current_state,
    workflow_summary: workflowStatus,
    recommendation_summary: recommendation,
    governance_summary: governance,
    operator_activity: activity,
    replay_summary: replay,
    timeline_view: timeline,
    generated_at: NOW,
    read_only: true,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: dashboardHash(base) });
}

export function createDashboardStatusApi(
  dashboard: DashboardViewModel,
  authorizedOperator = "mission_operator",
  authorityLevel = "Operator",
): DashboardStatusApiResponse {
  const base: Omit<DashboardStatusApiResponse, "integrity_hash"> = {
    api_id: `dashboard_status_api_${dashboard.workflow_id}`,
    workflow_id: dashboard.workflow_id,
    authorized_operator: authorizedOperator,
    authority_level: authorityLevel,
    sections: DASHBOARD_SECTIONS,
    dashboard,
    replay_ref: dashboard.replay_summary.replay_ref,
    read_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: apiHash(base) });
}

function collectFailures(input: {
  audit: WorkflowAuditReplayResult;
  workflowStatus: WorkflowStatusView;
  recommendation: RecommendationSummaryView;
  governance: GovernanceSummaryView;
  activity: OperatorActivityView;
  replay: ReplaySummaryView;
  timeline: WorkflowTimelineView;
  dashboard: DashboardViewModel;
  api: DashboardStatusApiResponse;
  requestingTenantId?: string;
}): readonly OperatorVisibilityDashboardFailureReason[] {
  const failures: OperatorVisibilityDashboardFailureReason[] = [];
  if (input.audit.audit_replay_status !== "PASS") failures.push("AUDIT_REPLAY_FAILED");
  if (!input.dashboard.workflow_id || input.audit.audit_events.length === 0) failures.push("WORKFLOW_DATA_UNAVAILABLE");
  if (!input.workflowStatus.current_state || input.workflowStatus.current_state === "UNKNOWN") failures.push("WORKFLOW_STATE_INVALID");
  if (!input.recommendation.recommended_decision || input.recommendation.confidence === "UNKNOWN") failures.push("RECOMMENDATION_INCOMPLETE");
  if (input.governance.policy_status !== "VISIBLE" || !input.governance.authority_required) failures.push("GOVERNANCE_STATUS_UNAVAILABLE");
  if (input.governance.constitutional_status !== "VISIBLE") failures.push("CONSTITUTIONAL_STATUS_UNAVAILABLE");
  if (input.replay.replay_status !== "CERTIFIED" || input.replay.replay_event_count !== input.audit.timeline_record.event_count) failures.push("REPLAY_HISTORY_INCOMPLETE");
  if (input.timeline.ordered_events.length !== input.audit.timeline_record.event_count || input.timeline.ordered_events.join(">") !== input.audit.timeline_record.ordered_events.join(">")) failures.push("TIMELINE_INCONSISTENT");
  if (input.timeline.lineage_chain.length !== input.audit.audit_events.length || input.timeline.lineage_chain.some((lineage) => lineage.endsWith(":"))) failures.push("LINEAGE_INCOMPLETE");
  if (!input.api.authorized_operator || !input.api.sections.includes("WORKFLOW_STATUS")) failures.push("AUTHORIZATION_FAILED");
  if (input.requestingTenantId && input.requestingTenantId !== input.dashboard.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.dashboard.read_only || !input.api.read_only) failures.push("READ_ONLY_VIOLATION");
  if (!input.dashboard.advisory_only || !input.audit.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    statusHash(input.workflowStatus) !== input.workflowStatus.integrity_hash
    || recommendationHash(input.recommendation) !== input.recommendation.integrity_hash
    || governanceHash(input.governance) !== input.governance.integrity_hash
    || activityHash(input.activity) !== input.activity.integrity_hash
    || replaySummaryHash(input.replay) !== input.replay.integrity_hash
    || timelineHash(input.timeline) !== input.timeline.integrity_hash
    || dashboardHash(input.dashboard) !== input.dashboard.integrity_hash
    || apiHash(input.api) !== input.api.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as OperatorVisibilityDashboardFailureReason[]);
}

function createValidation(workflowId: string, failures: readonly OperatorVisibilityDashboardFailureReason[]): OperatorVisibilityDashboardValidation {
  const has = (failure: OperatorVisibilityDashboardFailureReason) => failures.includes(failure);
  const base: Omit<OperatorVisibilityDashboardValidation, "integrity_hash"> = {
    validation_id: `operator_visibility_dashboard_validation_${workflowId}`,
    workflow_id: workflowId,
    workflow_data_available: !has("WORKFLOW_DATA_UNAVAILABLE"),
    workflow_state_valid: !has("WORKFLOW_STATE_INVALID"),
    recommendation_complete: !has("RECOMMENDATION_INCOMPLETE"),
    governance_visible: !has("GOVERNANCE_STATUS_UNAVAILABLE"),
    constitutional_visible: !has("CONSTITUTIONAL_STATUS_UNAVAILABLE"),
    replay_complete: !has("REPLAY_HISTORY_INCOMPLETE"),
    timeline_consistent: !has("TIMELINE_INCONSISTENT"),
    lineage_complete: !has("LINEAGE_INCOMPLETE"),
    authorized: !has("AUTHORIZATION_FAILED"),
    tenant_valid: !has("TENANT_MISMATCH"),
    read_only_valid: !has("READ_ONLY_VIOLATION"),
    advisory_only_valid: !has("ADVISORY_ONLY_VIOLATION"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function resultReplayHash(result: Omit<OperatorVisibilityDashboardResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    audit_result: result.audit_result,
    workflow_status: result.workflow_status,
    recommendation_summary: result.recommendation_summary,
    governance_summary: result.governance_summary,
    operator_activity: result.operator_activity,
    replay_summary: result.replay_summary,
    timeline_view: result.timeline_view,
    dashboard: result.dashboard,
    status_api: result.status_api,
    validation: result.validation,
    failures: result.failures,
  });
}

export function buildOperatorVisibilityDashboard(input: OperatorVisibilityDashboardInput = {}): OperatorVisibilityDashboardResult {
  const audit_result = input.audit_result ?? runWorkflowAuditReplay();
  const workflow_status = input.workflow_status ?? createWorkflowStatusView(audit_result);
  const recommendation_summary = input.recommendation_summary ?? createRecommendationSummaryView(audit_result);
  const governance_summary = input.governance_summary ?? createGovernanceSummaryView(audit_result);
  const operator_activity = input.operator_activity ?? createOperatorActivityView(audit_result);
  const replay_summary = input.replay_summary ?? createReplaySummaryView(audit_result);
  const timeline_view = input.timeline_view ?? createWorkflowTimelineView(audit_result);
  const dashboard = input.dashboard ?? createDashboardViewModel(audit_result, workflow_status, recommendation_summary, governance_summary, operator_activity, replay_summary, timeline_view);
  const status_api = input.status_api ?? createDashboardStatusApi(dashboard, input.authorized_operator, input.authority_level);
  const initialFailures = collectFailures({
    audit: audit_result,
    workflowStatus: workflow_status,
    recommendation: recommendation_summary,
    governance: governance_summary,
    activity: operator_activity,
    replay: replay_summary,
    timeline: timeline_view,
    dashboard,
    api: status_api,
    requestingTenantId: input.requesting_tenant_id,
  });
  const validation = createValidation(dashboard.workflow_id, initialFailures);
  const base: Omit<OperatorVisibilityDashboardResult, "integrity_hash" | "replay_hash"> = {
    dashboard_status: validation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.validation_status !== "VALID",
    audit_result,
    workflow_status,
    recommendation_summary,
    governance_summary,
    operator_activity,
    replay_summary,
    timeline_view,
    dashboard,
    status_api,
    validation,
    failures: validation.failures,
    deterministic: true,
    read_only: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly OperatorVisibilityDashboardFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = createValidation(dashboard.workflow_id, replayFailures);
    const replayBase: Omit<OperatorVisibilityDashboardResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      dashboard_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorVisibilityDashboard(result: OperatorVisibilityDashboardResult): OperatorVisibilityDashboardReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && statusHash(result.workflow_status) === result.workflow_status.integrity_hash
    && recommendationHash(result.recommendation_summary) === result.recommendation_summary.integrity_hash
    && governanceHash(result.governance_summary) === result.governance_summary.integrity_hash
    && activityHash(result.operator_activity) === result.operator_activity.integrity_hash
    && replaySummaryHash(result.replay_summary) === result.replay_summary.integrity_hash
    && timelineHash(result.timeline_view) === result.timeline_view.integrity_hash
    && dashboardHash(result.dashboard) === result.dashboard.integrity_hash
    && apiHash(result.status_api) === result.status_api.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash;
  const failures: OperatorVisibilityDashboardFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<OperatorVisibilityDashboardReplay, "integrity_hash"> = {
    replay_id: "replay_operator_visibility_dashboard",
    replay_valid,
    workflow_id: result.dashboard.workflow_id,
    dashboard_id: result.dashboard.dashboard_id,
    current_state: result.dashboard.current_state,
    rendered_sections: result.status_api.sections,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildOperatorVisibilityDashboardObservability(result: OperatorVisibilityDashboardResult): OperatorVisibilityDashboardObservability {
  return Object.freeze({
    dashboards_generated: result.dashboard_status === "PASS" ? 1 : 0,
    status_views_generated: result.workflow_status.workflow_id ? 1 : 0,
    recommendation_views_generated: result.recommendation_summary.recommended_decision ? 1 : 0,
    governance_views_generated: result.governance_summary.policy_status === "VISIBLE" ? 1 : 0,
    operator_activity_views_generated: result.operator_activity.timeline_ref ? 1 : 0,
    replay_views_generated: result.replay_summary.replay_status === "CERTIFIED" ? 1 : 0,
    timeline_views_generated: result.timeline_view.ordered_events.length > 0 ? 1 : 0,
    validation_failures: result.failures.length,
    replay_reproducibility: replayOperatorVisibilityDashboard(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getOperatorVisibilityDashboardFoundation(): OperatorVisibilityDashboardFoundation {
  const result = buildOperatorVisibilityDashboard();
  const replay = replayOperatorVisibilityDashboard(result);
  return Object.freeze({
    dashboard_version: DASHBOARD_VERSION,
    sections: DASHBOARD_SECTIONS,
    result,
    replay,
    observability: buildOperatorVisibilityDashboardObservability(result),
  });
}

export const OperatorVisibilityDashboard = Object.freeze({
  build: buildOperatorVisibilityDashboard,
  replay: replayOperatorVisibilityDashboard,
});
