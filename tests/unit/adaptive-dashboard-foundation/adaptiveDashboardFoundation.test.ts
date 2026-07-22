import { describe, expect, it } from "vitest";
import {
  establishAdaptiveDashboardFoundation,
  getAdaptiveDashboardFoundationContract,
  replayAdaptiveDashboardFoundation,
  validateAdaptiveDashboardFoundation,
} from "@/services/adaptive-dashboard-foundation";
import type { AdaptiveDashboardFailure, AdaptiveDashboardScenario, DashboardWidgetType } from "@/types/adaptive-dashboard-foundation";

describe("Mission Control Phase 10.14.1 Adaptive Dashboard Foundation", () => {
  const widgetTypes: readonly DashboardWidgetType[] = [
    "SUMMARY_CARD",
    "TABLE",
    "TIMELINE",
    "EVIDENCE_VIEWER",
    "REPLAY_VIEWER",
    "TREND_CHART",
    "HEAT_MAP",
    "STATUS_INDICATOR",
    "ALERT_PANEL",
    "APPROVAL_QUEUE",
    "CERTIFICATION_STATUS",
    "LINEAGE_VIEWER",
  ];

  it("publishes the read-only adaptive dashboard foundation contract", () => {
    const contract = getAdaptiveDashboardFoundationContract();

    expect(contract.doctrine.version).toBe("adaptive-dashboard-foundation/v10.14.1");
    expect(contract.doctrine.supported_widgets).toEqual(widgetTypes);
    expect(contract.doctrine.supported_views).toHaveLength(6);
    expect(contract.doctrine.search_domains).toHaveLength(10);
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.result.foundation_identifier).toBe("AdaptiveDashboardFoundation");
    expect(contract.validation.valid).toBe(true);
  });

  it("establishes deterministic dashboard foundation output", () => {
    const first = establishAdaptiveDashboardFoundation();
    const second = establishAdaptiveDashboardFoundation();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.view_registry.map((view) => view.integrity_hash)).toEqual(second.view_registry.map((view) => view.integrity_hash));
    expect(first.widget_framework.map((widget) => widget.integrity_hash)).toEqual(second.widget_framework.map((widget) => widget.integrity_hash));
    expect(validateAdaptiveDashboardFoundation(first).valid).toBe(true);
    expect(replayAdaptiveDashboardFoundation(first)).toBe(true);
  });

  it("builds the required dashboard registries and records", () => {
    const result = establishAdaptiveDashboardFoundation();

    expect(result.view_registry).toHaveLength(6);
    expect(new Set(result.view_registry.map((view) => view.view_id)).size).toBe(6);
    expect(result.widget_framework).toHaveLength(12);
    expect(result.layout_engine).toHaveLength(6);
    expect(result.dashboard_records).toHaveLength(6);
    expect(result.dashboard_records.every((record) => record.dashboard_record_id && record.tenant_id && record.mission_scope)).toBe(true);
    expect(result.dashboard_records.every((record) => record.source_record_refs.length > 0)).toBe(true);
    expect(result.dashboard_records.every((record) => record.visible_to_roles.length > 0)).toBe(true);
    expect(result.dashboard_records.every((record) => record.replay_refs.length > 0)).toBe(true);
  });

  it("preserves rendering, widget, layout, state, navigation, search, and filter guarantees", () => {
    const result = establishAdaptiveDashboardFoundation();

    expect(result.rendering_contract.deterministic_rendering_required).toBe(true);
    expect(result.widget_framework.every((widget, index) => widget.render_order === index + 1)).toBe(true);
    expect(result.widget_framework.every((widget) => widget.deterministic && widget.replay_supported && widget.permission_validated)).toBe(true);
    expect(result.layout_engine.every((layout) => layout.deterministic && layout.replayable && layout.widget_order.length > 0)).toBe(true);
    expect(result.state_manager.reproducible).toBe(true);
    expect(result.state_manager.replayable).toBe(true);
    expect(result.navigation_service.every((nav) => nav.deterministic && nav.preserves_filters && nav.preserves_replay_state && nav.preserves_tenant_boundary)).toBe(true);
    expect(result.search_engine.every((search) => search.deterministic_order && search.replayable && search.permission_aware && search.tenant_isolated)).toBe(true);
    expect(result.filtering_sorting.standard_filters).toContain("Replay Session");
    expect(result.filtering_sorting.sort_keys).toContain("certification_state");
  });

  it("enforces replay integration, governance visibility, tenant isolation, and field restrictions", () => {
    const result = establishAdaptiveDashboardFoundation();

    expect(result.replay_integration.every((link) => link.replayable && link.evidence_lineage_ref && link.governance_history_ref)).toBe(true);
    expect(result.permission_engine.every((permission) => permission.allowed)).toBe(true);
    expect(result.permission_engine.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
    expect(result.permission_engine.every((permission) => permission.constitutional_policy_enforced && permission.governance_restrictions_enforced)).toBe(true);
    expect(result.permission_engine.every((permission) => permission.tenant_isolation_enforced && permission.evidence_authorized)).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.governance_visible).toBe(true);
    expect(result.constitutional_enforced).toBe(true);
  });

  it("remains strictly observational and read-only", () => {
    const result = establishAdaptiveDashboardFoundation();

    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.approval_supported).toBe(false);
    expect(result.api_surface.production_state_changes_supported).toBe(false);
    expect(result.rendering_contract.mutation_supported).toBe(false);
    expect(result.rendering_contract.approval_supported).toBe(false);
    expect(result.rendering_contract.production_state_changes_supported).toBe(false);
    expect(result.read_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.execution_authority_granted).toBe(false);
  });

  it("records validation tests and observability metrics", () => {
    const result = establishAdaptiveDashboardFoundation();

    expect(result.validation_tests).toHaveLength(15);
    expect(result.validation_tests.every((test) => test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.metrics.rendering_latency_ms).toBe(9);
    expect(result.metrics.rendering_failures).toBe(0);
    expect(result.metrics.replay_failures).toBe(0);
    expect(result.metrics.permission_violations).toBe(0);
  });

  it.each([
    ["DUPLICATE_VIEW", "DUPLICATE_VIEW_DETECTED"],
    ["NONDETERMINISTIC_RENDERING", "DASHBOARD_RENDERING_NONDETERMINISTIC"],
    ["WIDGET_ORDER_DRIFT", "WIDGET_ORDER_NONDETERMINISTIC"],
    ["LAYOUT_DRIFT", "LAYOUT_NOT_REPRODUCIBLE"],
    ["STATE_NOT_REPLAYABLE", "STATE_NOT_REPLAYABLE"],
    ["NAVIGATION_BREAK", "NAVIGATION_NOT_DETERMINISTIC"],
    ["SEARCH_NONDETERMINISTIC", "SEARCH_NOT_DETERMINISTIC"],
    ["FILTER_SORT_DRIFT", "FILTER_SORT_NOT_DETERMINISTIC"],
    ["MISSING_REPLAY_REF", "REPLAY_REFERENCE_MISSING"],
    ["GOVERNANCE_VISIBILITY_MISSING", "GOVERNANCE_VISIBILITY_MISSING"],
    ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["EXECUTION_AUTHORITY_EXPOSED", "DASHBOARD_EXECUTION_AUTHORITY_EXPOSED"],
  ] as const)("fails closed for %s", (scenario: AdaptiveDashboardScenario, failure: AdaptiveDashboardFailure) => {
    const result = establishAdaptiveDashboardFoundation({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validateAdaptiveDashboardFoundation(result).valid).toBe(false);
    expect(replayAdaptiveDashboardFoundation(result)).toBe(false);
  });

  it("detects nested dashboard record tampering", () => {
    const result = establishAdaptiveDashboardFoundation();
    const tampered = {
      ...result,
      dashboard_records: [
        {
          ...result.dashboard_records[0],
          tenant_id: "tenant-cross-boundary",
        },
        ...result.dashboard_records.slice(1),
      ],
    };

    expect(validateAdaptiveDashboardFoundation(tampered).integrity_hash_valid).toBe(false);
    expect(replayAdaptiveDashboardFoundation(tampered)).toBe(false);
  });
});
