import { describe, expect, it } from "vitest";
import {
  buildConstitutionalAssuranceDashboard,
  buildConstitutionalAssuranceDashboardObservabilitySurface,
  getConstitutionalAssuranceDashboardEngine,
  listConstitutionalDashboardExplanations,
  listConstitutionalDashboardLedger,
  listConstitutionalDashboardPanels,
  listConstitutionalDashboardViews,
  validateConstitutionalAssuranceDashboard,
} from "@/services/constitutional-assurance-dashboard";
import type { ConstitutionalDashboardFailure, ConstitutionalDashboardPanelType, ConstitutionalDashboardRole, ConstitutionalDashboardScenario } from "@/types/constitutional-assurance-dashboard";

const panelTypes: readonly ConstitutionalDashboardPanelType[] = ["CONSTITUTIONAL_SCORE", "AUTHORITY_STATUS", "GOVERNANCE_STATUS", "OPERATOR_AUTHORITY", "LEARNING_COMPLIANCE", "OPTIMIZATION_COMPLIANCE", "RUNTIME_HEALTH", "VIOLATION_TIMELINE", "CONFIDENCE_HISTORY", "REPLAY_INTEGRITY", "SYSTEM_RESILIENCE", "RECOMMENDATION_PANEL"];
const roles: readonly ConstitutionalDashboardRole[] = ["EXECUTIVE", "OPERATOR", "GOVERNANCE", "AUDIT", "CERTIFICATION", "HISTORICAL"];

describe("constitutional assurance dashboard", () => {
  it("publishes the deterministic read-only dashboard bundle", () => {
    const bundle = getConstitutionalAssuranceDashboardEngine();

    expect(bundle.doctrine.engine_version).toBe("constitutional-assurance-dashboard/v8ALT.10.9");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_ASSURANCE_DASHBOARD_READY");
    expect(bundle.doctrine.panel_types).toEqual(panelTypes);
    expect(bundle.doctrine.roles).toEqual(roles);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.read_only).toBe(true);
    expect(bundle.repository.mission_execution_modification_authorized).toBe(false);
    expect(bundle.repository.constitutional_policy_modification_authorized).toBe(false);
    expect(bundle.repository.governance_decision_authorized).toBe(false);
    expect(bundle.repository.authority_assignment_authorized).toBe(false);
    expect(bundle.repository.autonomous_behavior_modification_authorized).toBe(false);
  });

  it("builds all dashboard panels and role views", () => {
    const repository = buildConstitutionalAssuranceDashboard();

    expect(repository.final_state).toBe("CONSTITUTIONAL_ASSURANCE_DASHBOARD_COMPLETE");
    expect(repository.snapshot.dashboard_state).toBe("HEALTHY");
    expect(repository.panels.map((panel) => panel.panel_type)).toEqual(panelTypes);
    expect(repository.views.map((view) => view.role)).toEqual(roles);
    expect(repository.views.find((view) => view.role === "AUDIT")?.visible_panels).toEqual(panelTypes);
  });

  it("lists panels, views, explanations, and ledger entries", () => {
    expect(listConstitutionalDashboardPanels().length).toBe(panelTypes.length);
    expect(listConstitutionalDashboardViews().length).toBe(roles.length);
    expect(listConstitutionalDashboardExplanations().length).toBe(panelTypes.length);
    expect(listConstitutionalDashboardLedger().length).toBe(roles.length);
  });

  it("keeps dashboard rendering deterministic and ledger entries immutable", () => {
    const first = buildConstitutionalAssuranceDashboard();
    const second = buildConstitutionalAssuranceDashboard();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.snapshot.integrity_hash).toBe(first.snapshot.integrity_hash);
    expect(first.ledger.every((entry) => entry.immutable && entry.append_only)).toBe(true);
  });

  it("provides complete explainability for every displayed metric", () => {
    const repository = buildConstitutionalAssuranceDashboard();

    expect(repository.explanations.every((item) => item.complete)).toBe(true);
    expect(repository.explanations.every((item) => item.constitutional_source.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.supporting_evidence.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.replay_reference.length > 0)).toBe(true);
    expect(repository.explanations.every((item) => item.integrity_verification === "VERIFIED")).toBe(true);
    expect(repository.explanations.every((item) => item.lineage_reference.length > 0)).toBe(true);
  });

  it.each([
    ["CONSTITUTIONAL_DATA_CORRUPTION", "CONSTITUTIONAL_DATA_CORRUPTION_DETECTED"],
    ["REPLAY_INCONSISTENCY", "DASHBOARD_REPLAY_INCONSISTENCY_DETECTED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "DASHBOARD_INTEGRITY_VERIFICATION_FAILED"],
    ["RENDERING_NONDETERMINISM", "DASHBOARD_RENDERING_NONDETERMINISM_DETECTED"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "DASHBOARD_CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["INCOMPLETE_LINEAGE", "DASHBOARD_LINEAGE_INCOMPLETE"],
    ["UNAUTHORIZED_DASHBOARD_MODIFICATION", "UNAUTHORIZED_DASHBOARD_MODIFICATION_DETECTED"],
    ["ROLE_AUTHORIZATION_FAILURE", "DASHBOARD_ROLE_AUTHORIZATION_FAILED"],
    ["TENANT_ISOLATION_BREACH", "DASHBOARD_TENANT_ISOLATION_BREACH"],
    ["STALE_CONSTITUTIONAL_STATE", "STALE_CONSTITUTIONAL_STATE_DETECTED"],
    ["INCONSISTENT_CONFIDENCE_CALCULATIONS", "INCONSISTENT_CONFIDENCE_CALCULATIONS_DETECTED"],
    ["UNVERIFIABLE_DASHBOARD_METRICS", "UNVERIFIABLE_DASHBOARD_METRICS_DETECTED"],
  ] satisfies [ConstitutionalDashboardScenario, ConstitutionalDashboardFailure][])("fails closed or restricts visibility for %s", (scenario, failure) => {
    const repository = buildConstitutionalAssuranceDashboard({ scenario });
    const validation = validateConstitutionalAssuranceDashboard(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_ASSURANCE_DASHBOARD_FAIL_CLOSED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed_ready).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.read_only).toBe(true);
    expect(repository.mission_execution_modification_authorized).toBe(false);
  });

  it("validates scenario-specific dashboard controls", () => {
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "RENDERING_NONDETERMINISM" })).deterministic_rendering).toBe(false);
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "REPLAY_INCONSISTENCY" })).replay_identical).toBe(false);
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "MISSING_CONSTITUTIONAL_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "INCOMPLETE_LINEAGE" })).lineage_complete).toBe(false);
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "ROLE_AUTHORIZATION_FAILURE" })).role_authorized).toBe(false);
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "TENANT_ISOLATION_BREACH" })).tenant_isolated).toBe(false);
    expect(validateConstitutionalAssuranceDashboard(buildConstitutionalAssuranceDashboard({ scenario: "STALE_CONSTITUTIONAL_STATE" })).current_state).toBe(false);
  });

  it("publishes observability for dashboard certification", () => {
    const surface = buildConstitutionalAssuranceDashboardObservabilitySurface(buildConstitutionalAssuranceDashboard({ scenario: "ROLE_AUTHORIZATION_FAILURE" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_ASSURANCE_DASHBOARD_FAIL_CLOSED");
    expect(surface.dashboard_state).toBe("RESTRICTED");
    expect(surface.panel_count).toBe(panelTypes.length);
    expect(surface.view_count).toBe(roles.length);
    expect(surface.explanation_count).toBe(panelTypes.length);
    expect(surface.ledger_count).toBe(roles.length);
    expect(surface.read_only).toBe(true);
    expect(surface.mission_execution_modification_authorized).toBe(false);
  });
});
