import { describe, expect, it } from "vitest";
import {
  buildDashboardObservabilitySurface,
  getMultiAgentCoordinationDashboard,
  loadAgentGraph,
  loadAuthorityView,
  loadCommunicationAudit,
  loadConflictView,
  loadCoordinationDashboard,
  loadDashboardSnapshot,
  loadReplayTimeline,
  validateCoordinationDashboard,
} from "@/services/multi-agent-coordination-dashboard";
import type { DashboardFailure, DashboardScenario } from "@/types/multi-agent-coordination-dashboard";

describe("multi-agent coordination dashboard", () => {
  it("publishes the certified read-only dashboard bundle", () => {
    const bundle = getMultiAgentCoordinationDashboard();

    expect(bundle.doctrine.contract_version).toBe("multi-agent-coordination-dashboard/v8ALT.7.11");
    expect(bundle.doctrine.final_state).toBe("MULTI_AGENT_COORDINATION_DASHBOARD_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.dashboard.read_only).toBe(true);
    expect(bundle.dashboard.execution_capability).toBe(false);
  });

  it("shows all major dashboard views", () => {
    const validation = validateCoordinationDashboard();

    expect(validation.active_agents_visible).toBe(true);
    expect(validation.sessions_visible).toBe(true);
    expect(validation.mission_state_complete).toBe(true);
    expect(validation.planning_visible).toBe(true);
    expect(validation.delegation_visible).toBe(true);
    expect(validation.authority_visible).toBe(true);
    expect(validation.governance_visible).toBe(true);
    expect(validation.replay_visible).toBe(true);
    expect(validation.conflicts_visible).toBe(true);
    expect(validation.deadlocks_visible).toBe(true);
    expect(validation.communication_alerts_visible).toBe(true);
  });

  it("loads deterministic graph, replay, conflict, authority, communication, and snapshot views", () => {
    expect(Object.keys(loadAgentGraph()).length).toBeGreaterThan(0);
    expect(Object.keys(loadReplayTimeline()).length).toBeGreaterThan(0);
    expect(Object.keys(loadConflictView()).length).toBeGreaterThan(0);
    expect(Object.keys(loadAuthorityView()).length).toBeGreaterThan(0);
    expect(Object.keys(loadCommunicationAudit()).length).toBeGreaterThan(0);
    expect(loadDashboardSnapshot().integrity_hash).toBeTruthy();
  });

  it("enforces tenant isolation, integrity, operator visibility, and read-only behavior", () => {
    const validation = validateCoordinationDashboard();

    expect(validation.graph_deterministic).toBe(true);
    expect(validation.timeline_deterministic).toBe(true);
    expect(validation.read_only_enforced).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
    expect(validation.integrity_valid).toBe(true);
    expect(validation.operator_visible).toBe(true);
  });

  it.each([
    ["HIDDEN_ACTIVE_AGENT", "HIDDEN_ACTIVE_AGENT_DETECTED"],
    ["HIDDEN_COORDINATION_SESSION", "HIDDEN_COORDINATION_SESSION_DETECTED"],
    ["INCOMPLETE_MISSION_STATE", "INCOMPLETE_MISSION_STATE_DETECTED"],
    ["HIDDEN_PLANNING", "HIDDEN_PLANNING_SYNCHRONIZATION"],
    ["HIDDEN_DELEGATION", "HIDDEN_DELEGATION_DETECTED"],
    ["HIDDEN_AUTHORITY", "HIDDEN_AUTHORITY_BOUNDARY_DETECTED"],
    ["HIDDEN_GOVERNANCE", "HIDDEN_GOVERNANCE_STATE_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_VISUALIZATION_MISMATCH"],
    ["HIDDEN_CONFLICT", "HIDDEN_CONFLICT_DETECTED"],
    ["HIDDEN_DEADLOCK", "HIDDEN_DEADLOCK_DETECTED"],
    ["SUPPRESSED_COMMUNICATION_ALERT", "SUPPRESSED_COMMUNICATION_ALERT_DETECTED"],
    ["EXECUTION_CAPABILITY", "DASHBOARD_EXECUTION_CAPABILITY_DETECTED"],
    ["CROSS_TENANT_VISUALIZATION", "CROSS_TENANT_VISUALIZATION_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [DashboardScenario, DashboardFailure][])("fails closed for %s", (scenario, failure) => {
    const validation = validateCoordinationDashboard(loadCoordinationDashboard({ scenario }));

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("publishes dashboard observability", () => {
    const surface = buildDashboardObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.agent_count).toBeGreaterThan(0);
    expect(surface.session_count).toBe(1);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
