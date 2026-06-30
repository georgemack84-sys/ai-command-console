import { describe, expect, it } from "vitest";
import {
  assertGovernanceDashboardActionBlocked,
  buildGovernanceDashboardObservabilitySurface,
  buildGovernanceDashboardView,
  getGovernanceDashboardContract,
} from "@/services/governance-dashboard";
import type { GovernanceDashboardAction } from "@/types/governance-dashboard";

describe("Mission Control Phase 7K.1 Governance Dashboard", () => {
  it("defines read-only deterministic dashboard doctrine", () => {
    const contract = getGovernanceDashboardContract();

    expect(contract.doctrine.schema_version).toBe("governance-dashboard/v7K.1");
    expect(contract.doctrine.principles).toContain("read-only");
    expect(contract.doctrine.principles).toContain("tenant-isolated");
    expect(contract.doctrine.widgets).toContain("CERTIFICATION_STATUS");
    expect(contract.doctrine.prohibited_actions).toContain("EXECUTE_RECOMMENDATION");
  });

  it("builds a certified governance dashboard view", () => {
    const view = buildGovernanceDashboardView();

    expect(view.schema_version).toBe("governance-dashboard/v7K.1");
    expect(view.read_only).toBe(true);
    expect(view.advisory_only).toBe(true);
    expect(view.mutation_allowed).toBe(false);
    expect(view.approval_allowed).toBe(false);
    expect(view.execution_allowed).toBe(false);
    expect(view.certification_status.state).toBe("PASS");
    expect(view.mission_summary.certification_status).toBe("PASS");
    expect(view.replay_status.state).toBe("VERIFIED");
  });

  it("renders deterministic widget ordering and hashes", () => {
    const first = buildGovernanceDashboardView();
    const second = buildGovernanceDashboardView();

    expect(second.dashboard_hash).toBe(first.dashboard_hash);
    expect(second.widgets.map((widget) => widget.type)).toEqual(first.deterministic_ordering);
    expect(second.widgets.map((widget) => widget.widget_hash)).toEqual(first.widgets.map((widget) => widget.widget_hash));
  });

  it("surfaces mission, tenant, governance, recommendations, compliance, risk, and escalation sections", () => {
    const view = buildGovernanceDashboardView();

    expect(view.mission_summary.mission_id).toBe("mission_governance_001");
    expect(view.tenant_summary.tenant_id).toBe("tenant_alpha");
    expect(view.governance_summary.length).toBeGreaterThan(0);
    expect(view.recommendations[0].advisory_disclaimer).toContain("Advisory-only");
    expect(view.compliance.length).toBeGreaterThan(0);
    expect(view.risks.length).toBeGreaterThan(0);
    expect(view.escalations.length).toBeGreaterThan(0);
  });

  it("exposes replay, certification, trends, and notifications", () => {
    const view = buildGovernanceDashboardView();

    expect(view.historical_trends).toHaveLength(3);
    expect(view.notifications[0].evidence_refs).toContain("evidence:7j5:query-certification");
    expect(view.replay_status.replay_consistency).toBe(true);
    expect(view.certification_status.certification_hash).toBeTruthy();
  });

  it("reflects conditional and failed certification states without enabling downstream actions", () => {
    const conditional = buildGovernanceDashboardView({ certification_status: "CONDITIONAL_PASS" });
    const failed = buildGovernanceDashboardView({ certification_status: "FAIL" });

    expect(conditional.certification_status.state).toBe("CONDITIONAL_PASS");
    expect(conditional.execution_allowed).toBe(false);
    expect(failed.certification_status.state).toBe("FAIL");
    expect(failed.mission_summary.mission_state).toBe("BLOCKED");
    expect(failed.execution_allowed).toBe(false);
  });

  it("keeps tenant scope explicit", () => {
    const view = buildGovernanceDashboardView({ tenant_id: "tenant_custom", mission_id: "mission_custom", operator_id: "operator_custom" });

    expect(view.tenant_id).toBe("tenant_custom");
    expect(view.mission_id).toBe("mission_custom");
    expect(view.operator_id).toBe("operator_custom");
    expect(view.tenant_isolated).toBe(true);
    expect(view.authorization_enforced).toBe(true);
  });

  it("exposes compact observability", () => {
    const surface = buildGovernanceDashboardObservabilitySurface();

    expect(surface.widget_count).toBe(16);
    expect(surface.notification_count).toBeGreaterThan(0);
    expect(surface.read_only).toBe(true);
    expect(surface.dashboard_hash).toBeTruthy();
  });

  it.each([
    "MODIFY_POLICY",
    "APPROVE_RECOMMENDATION",
    "EXECUTE_RECOMMENDATION",
    "OVERRIDE_GOVERNANCE",
    "ALTER_REPLAY",
    "MODIFY_INTEGRITY",
  ] as readonly GovernanceDashboardAction[])("blocks prohibited dashboard action %s", (action) => {
    expect(() => assertGovernanceDashboardActionBlocked(action)).toThrow("Governance Dashboard is read-only");
  });
});
