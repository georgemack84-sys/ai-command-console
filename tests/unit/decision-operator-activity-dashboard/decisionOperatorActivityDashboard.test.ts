import { describe, expect, it } from "vitest";
import {
  OPERATOR_ACTION_TYPES,
  OPERATOR_APPROVAL_STATES,
  OPERATOR_ESCALATION_TYPES,
  OPERATOR_OVERRIDE_CATEGORIES,
  OPERATOR_QUEUE_CATEGORIES,
  computeOperatorActionRecordHash,
  getOperatorActivityDashboardFoundation,
  replayOperatorActivityDashboard,
  runOperatorActivityDashboard,
} from "@/services/decision-operator-activity-dashboard";
import type { OperatorActivityDashboardFailure, OperatorActivityDashboardInput } from "@/types/decision-operator-activity-dashboard";

describe("Mission Control Phase 9.11.8 Operator Activity Dashboard", () => {
  it("publishes the operator activity dashboard foundation", () => {
    const foundation = getOperatorActivityDashboardFoundation();

    expect(foundation.dashboard_version).toBe("decision-operator-activity-dashboard/v1");
    expect(foundation.queue_categories).toEqual(OPERATOR_QUEUE_CATEGORIES);
    expect(foundation.approval_states).toEqual(OPERATOR_APPROVAL_STATES);
    expect(foundation.override_categories).toEqual(OPERATOR_OVERRIDE_CATEGORIES);
    expect(foundation.escalation_types).toEqual(OPERATOR_ESCALATION_TYPES);
    expect(foundation.action_types).toEqual(OPERATOR_ACTION_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("renders deterministic work queue, approval, override, escalation, and history views", () => {
    const first = runOperatorActivityDashboard();
    const second = runOperatorActivityDashboard();

    expect(second).toEqual(first);
    expect(first.work_queue.operator_id).toBe("operator_alpha");
    expect(first.work_queue.assigned_decisions).toContain("decision_active_priority");
    expect(first.approval_dashboard.approval_history.length).toBeGreaterThan(0);
    expect(first.override_dashboard.override_refs.length).toBeGreaterThan(0);
    expect(first.escalation_dashboard.escalation_refs.length).toBeGreaterThan(0);
    expect(first.history_viewer.timeline_refs.length).toBe(first.action_records.length);
  });

  it("preserves action record integrity and immutable operator activity evidence", () => {
    const result = runOperatorActivityDashboard();

    expect(result.action_records.every((record) => computeOperatorActionRecordHash(record) === record.integrity_hash)).toBe(true);
    expect(result.activity_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4, 5]);
    expect(result.activity_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("shows workload metrics, authority context, replay refs, and certification refs", () => {
    const result = runOperatorActivityDashboard();

    expect(result.work_queue.workload_metrics.assigned_decisions).toBe(result.work_queue.assigned_decisions.length);
    expect(result.work_queue.workload_metrics.pending_workload).toBe(result.work_queue.pending_actions.length);
    expect(result.escalation_dashboard.assigned_authority).toContain("governance_board");
    expect(result.activity_record.replay_ref).toBeTruthy();
    expect(result.activity_record.certification_ref).toBeTruthy();
    expect(result.validation.authority_assignments_consistent).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runOperatorActivityDashboard();

    expect(replayOperatorActivityDashboard(result)).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_operator_or_orchestration).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("validates every operator activity boundary", () => {
    const result = runOperatorActivityDashboard();

    expect(result.validation.work_queues_complete).toBe(true);
    expect(result.validation.approval_history_complete).toBe(true);
    expect(result.validation.overrides_visible).toBe(true);
    expect(result.validation.escalations_visible).toBe(true);
    expect(result.validation.operator_history_reconstructable).toBe(true);
    expect(result.validation.workload_metrics_accurate).toBe(true);
    expect(result.validation.replay_refs_present).toBe(true);
    expect(result.validation.certification_refs_present).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["INCOMPLETE_WORK_QUEUE", "OPERATOR_WORK_QUEUES_INCOMPLETE"],
    ["MISSING_APPROVAL_HISTORY", "APPROVAL_HISTORY_MISSING"],
    ["HIDE_OVERRIDES", "OVERRIDES_HIDDEN"],
    ["OMIT_ESCALATIONS", "ESCALATION_ACTIVITY_OMITTED"],
    ["BROKEN_HISTORY", "OPERATOR_HISTORY_RECONSTRUCTION_FAILED"],
    ["BAD_WORKLOAD_METRICS", "WORKLOAD_METRICS_INACCURATE"],
    ["BAD_AUTHORITY_ASSIGNMENTS", "AUTHORITY_ASSIGNMENTS_INCONSISTENT"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION_REFS", "CERTIFICATION_REFERENCES_ABSENT"],
    ["NONDETERMINISTIC_ORDER", "DASHBOARD_ORDER_NONDETERMINISTIC"],
    ["CROSS_TENANT", "CROSS_TENANT_OPERATOR_DATA_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "OPERATOR_ACTIVITY_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<OperatorActivityDashboardInput["scenario"]>, OperatorActivityDashboardFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOperatorActivityDashboard({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_operator_or_orchestration).toBe(false);
  });

  it("fails closed when the role lacks operator dashboard visibility", () => {
    const result = runOperatorActivityDashboard({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runOperatorActivityDashboard();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorActivityDashboard(tampered)).toBe(false);
  });
});
