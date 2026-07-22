import { describe, expect, it } from "vitest";
import {
  DECISION_DASHBOARD_LIFECYCLE_STATES,
  DECISION_ORCHESTRATION_STAGES,
  computeDecisionStateRecordHash,
  getDecisionStateDashboardFoundation,
  replayDecisionStateDashboard,
  runDecisionStateDashboard,
} from "@/services/decision-state-dashboard";
import type { DecisionDashboardFailure, DecisionStateDashboardInput } from "@/types/decision-state-dashboard";

describe("Mission Control Phase 9.11.2 Decision State Dashboard", () => {
  it("publishes the decision state dashboard foundation", () => {
    const foundation = getDecisionStateDashboardFoundation();

    expect(foundation.dashboard_version).toBe("decision-state-dashboard/v1");
    expect(foundation.lifecycle_states).toEqual(DECISION_DASHBOARD_LIFECYCLE_STATES);
    expect(foundation.orchestration_stages).toEqual(DECISION_ORCHESTRATION_STAGES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("maintains the authoritative decision state registry", () => {
    const result = runDecisionStateDashboard();

    expect(result.registry.map((record) => record.lifecycle_state)).toEqual(["ACTIVE", "QUEUED", "BLOCKED", "ESCALATED", "DEFERRED", "COMPLETED", "CANCELLED"]);
    expect(result.registry.every((record) => record.orchestration_id === result.observability_result.certification_result.certification_record.orchestration_id)).toBe(true);
    expect(result.registry.every((record) => computeDecisionStateRecordHash(record) === record.integrity_hash)).toBe(true);
  });

  it("builds active, blocked, escalation, deferred, and operator queue dashboards", () => {
    const result = runDecisionStateDashboard();

    expect(result.active_dashboard.records.map((record) => record.lifecycle_state)).toEqual(["ACTIVE", "QUEUED"]);
    expect(result.blocked_dashboard.records[0]?.blocker_reason).toBe("governance approval pending");
    expect(result.escalation_dashboard.active_escalations[0]?.escalation_state).toBe("ACTIVE");
    expect(result.deferred_dashboard.records[0]?.deferred_state).toBe("AWAITING_EVIDENCE");
    expect(result.operator_queue_dashboard.pending_approvals).toContain("decision_blocked_governance");
    expect(result.operator_queue_dashboard.pending_escalations).toContain("decision_escalated_authority");
  });

  it("calculates operational, governance, operator, replay, and certification metrics", () => {
    const result = runDecisionStateDashboard();

    expect(result.metrics.active_decisions).toBe(1);
    expect(result.metrics.queued_decisions).toBe(1);
    expect(result.metrics.blocked_decisions).toBe(1);
    expect(result.metrics.deferred_decisions).toBe(1);
    expect(result.metrics.escalated_decisions).toBe(1);
    expect(result.metrics.pending_approvals).toBe(2);
    expect(result.metrics.replay_failures).toBe(0);
    expect(result.metrics.failed_checks).toBe(0);
  });

  it("preserves deterministic ordering, replayability, and advisory-only boundaries", () => {
    const first = runDecisionStateDashboard();
    const second = runDecisionStateDashboard();

    expect(second).toEqual(first);
    expect(replayDecisionStateDashboard(first)).toBe(true);
    expect(first.active_dashboard.deterministic_sort).toEqual(["priority", "created_at", "decision_id"]);
    expect(first.advisory_only).toBe(true);
    expect(first.mutates_orchestration).toBe(false);
    expect(first.execution_authority_granted).toBe(false);
  });

  it("enforces tenant, authorization, governance, replay, certification, and integrity validation", () => {
    const result = runDecisionStateDashboard();

    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.authorization_valid).toBe(true);
    expect(result.validation.governance_visible).toBe(true);
    expect(result.validation.replay_consistent).toBe(true);
    expect(result.validation.certification_visible).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["MISSING_ACTIVE", "ACTIVE_DECISIONS_MISSING"],
    ["HIDE_BLOCKED", "BLOCKED_DECISIONS_HIDDEN"],
    ["BAD_ESCALATION", "ESCALATION_STATUS_INACCURATE"],
    ["MISSING_DEFERRED", "DEFERRED_DECISIONS_UNTRACKED"],
    ["INCOMPLETE_OPERATOR_QUEUE", "OPERATOR_QUEUE_INCOMPLETE"],
    ["STATE_MISMATCH", "DASHBOARD_STATE_MISMATCH"],
    ["BAD_LIFECYCLE", "LIFECYCLE_TRANSITION_INVALID"],
    ["HIDE_GOVERNANCE", "GOVERNANCE_RESTRICTIONS_OMITTED"],
    ["BAD_REPLAY", "REPLAY_STATUS_INCONSISTENT"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_STATUS_ABSENT"],
    ["CROSS_TENANT", "CROSS_TENANT_INFORMATION_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "DASHBOARD_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<DecisionStateDashboardInput["scenario"]>, DecisionDashboardFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runDecisionStateDashboard({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_orchestration).toBe(false);
  });

  it("fails closed when the role lacks decision visibility permission", () => {
    const result = runDecisionStateDashboard({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects top-level replay tampering", () => {
    const result = runDecisionStateDashboard();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayDecisionStateDashboard(tampered)).toBe(false);
  });
});
