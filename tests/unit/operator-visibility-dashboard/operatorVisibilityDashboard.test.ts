import { describe, expect, it } from "vitest";
import {
  DASHBOARD_SECTIONS,
  buildOperatorVisibilityDashboard,
  computeDashboardViewModelHash,
  computeGovernanceSummaryViewHash,
  computeRecommendationSummaryViewHash,
  computeReplaySummaryViewHash,
  computeWorkflowStatusViewHash,
  computeWorkflowTimelineViewHash,
  createDashboardViewModel,
  createGovernanceSummaryView,
  createRecommendationSummaryView,
  createReplaySummaryView,
  createWorkflowStatusView,
  createWorkflowTimelineView,
  getOperatorVisibilityDashboardFoundation,
  replayOperatorVisibilityDashboard,
} from "@/services/operator-visibility-dashboard";
import { runWorkflowAuditReplay } from "@/services/workflow-audit-replay";

const foundation = getOperatorVisibilityDashboardFoundation();
const baseAudit = foundation.result.audit_result;

describe("Mission Control Phase 9.9.9 Operator Visibility Dashboard Model", () => {
  it("publishes the operator visibility dashboard foundation", () => {
    expect(foundation.dashboard_version).toBe("operator-visibility-dashboard/v1");
    expect(foundation.sections).toEqual(DASHBOARD_SECTIONS);
    expect(foundation.result.dashboard_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("renders deterministic read-only dashboard view models from audit records", () => {
    const first = buildOperatorVisibilityDashboard({ audit_result: baseAudit });
    const second = buildOperatorVisibilityDashboard({ audit_result: baseAudit });

    expect(first).toEqual(second);
    expect(first.dashboard.read_only).toBe(true);
    expect(first.dashboard.advisory_only).toBe(true);
    expect(first.status_api.sections).toEqual(DASHBOARD_SECTIONS);
    expect(first.dashboard.current_state).toBe("ARCHIVED");
  });

  it("shows workflow status, recommendations, governance, activity, replay, and timeline", () => {
    const result = buildOperatorVisibilityDashboard({ audit_result: baseAudit });

    expect(result.workflow_status.current_state).toBe("ARCHIVED");
    expect(result.recommendation_summary.recommended_decision).toContain("Decision package presented");
    expect(result.governance_summary.policy_status).toBe("VISIBLE");
    expect(result.governance_summary.constitutional_status).toBe("VISIBLE");
    expect(result.operator_activity.approvals).toHaveLength(1);
    expect(result.operator_activity.overrides).toHaveLength(1);
    expect(result.operator_activity.escalations).toHaveLength(1);
    expect(result.replay_summary.replay_status).toBe("CERTIFIED");
    expect(result.timeline_view.ordered_events).toEqual(baseAudit.timeline_record.ordered_events);
  });

  it("fails closed when workflow, recommendation, governance, constitutional, replay, or timeline data is incomplete", () => {
    const status = createWorkflowStatusView(baseAudit);
    const recommendation = createRecommendationSummaryView(baseAudit);
    const governance = createGovernanceSummaryView(baseAudit);
    const replay = createReplaySummaryView(baseAudit);
    const timeline = createWorkflowTimelineView(baseAudit);
    const badStatus = { ...status, current_state: "", integrity_hash: computeWorkflowStatusViewHash({ ...status, current_state: "" }) };
    const badRecommendation = { ...recommendation, recommended_decision: "", integrity_hash: computeRecommendationSummaryViewHash({ ...recommendation, recommended_decision: "" }) };
    const badGovernance = { ...governance, policy_status: "MISSING" as const, constitutional_status: "MISSING" as const, integrity_hash: computeGovernanceSummaryViewHash({ ...governance, policy_status: "MISSING" as const, constitutional_status: "MISSING" as const }) };
    const badReplay = { ...replay, replay_status: "REJECTED" as const, integrity_hash: computeReplaySummaryViewHash({ ...replay, replay_status: "REJECTED" as const }) };
    const badTimeline = { ...timeline, ordered_events: [], integrity_hash: computeWorkflowTimelineViewHash({ ...timeline, ordered_events: [] }) };

    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, workflow_status: badStatus }).failures).toContain("WORKFLOW_STATE_INVALID");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, recommendation_summary: badRecommendation }).failures).toContain("RECOMMENDATION_INCOMPLETE");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, governance_summary: badGovernance }).failures).toEqual(expect.arrayContaining(["GOVERNANCE_STATUS_UNAVAILABLE", "CONSTITUTIONAL_STATUS_UNAVAILABLE"]));
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, replay_summary: badReplay }).failures).toContain("REPLAY_HISTORY_INCOMPLETE");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, timeline_view: badTimeline }).failures).toContain("TIMELINE_INCONSISTENT");
  });

  it("enforces audit integration, tenant isolation, authorization, lineage, read-only, advisory-only, and integrity checks", () => {
    const badAudit = runWorkflowAuditReplay({ authorized_component: "unknown" });
    const timeline = createWorkflowTimelineView(baseAudit);
    const dashboard = createDashboardViewModel(baseAudit);
    const badLineage = { ...timeline, lineage_chain: [""], integrity_hash: computeWorkflowTimelineViewHash({ ...timeline, lineage_chain: [""] }) };
    const notReadOnly = { ...dashboard, read_only: false as true, integrity_hash: computeDashboardViewModelHash({ ...dashboard, read_only: false as true }) };
    const notAdvisory = { ...dashboard, advisory_only: false as true, integrity_hash: computeDashboardViewModelHash({ ...dashboard, advisory_only: false as true }) };
    const tampered = { ...dashboard, current_state: "tampered" };

    expect(buildOperatorVisibilityDashboard({ audit_result: badAudit }).failures).toContain("AUDIT_REPLAY_FAILED");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, requesting_tenant_id: "tenant_beta" }).failures).toContain("TENANT_MISMATCH");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, authorized_operator: "" }).failures).toContain("AUTHORIZATION_FAILED");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, timeline_view: badLineage }).failures).toContain("LINEAGE_INCOMPLETE");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, dashboard: notReadOnly }).failures).toContain("READ_ONLY_VIOLATION");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, dashboard: notAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(buildOperatorVisibilityDashboard({ audit_result: baseAudit, dashboard: tampered }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
  });

  it("fails closed when immutable audit records are unavailable", () => {
    const emptyAudit = runWorkflowAuditReplay({ audit_events: [] });

    expect(buildOperatorVisibilityDashboard({ audit_result: emptyAudit }).failures).toEqual(expect.arrayContaining(["AUDIT_REPLAY_FAILED", "WORKFLOW_DATA_UNAVAILABLE"]));
  });

  it("replays dashboard rendering deterministically and detects divergence", () => {
    const valid = buildOperatorVisibilityDashboard({ audit_result: baseAudit });
    const replay = replayOperatorVisibilityDashboard(valid);
    const mismatch = buildOperatorVisibilityDashboard({ audit_result: baseAudit, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayOperatorVisibilityDashboard({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.rendered_sections).toEqual(DASHBOARD_SECTIONS);
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
