import { describe, expect, it } from "vitest";
import {
  getFeedbackAnalyticsDashboardFoundation,
  renderFeedbackAnalyticsDashboard,
  replayFeedbackAnalyticsDashboard,
} from "@/services/feedback-analytics-dashboard";
import type { FeedbackAnalyticsFailure, FeedbackAnalyticsScenario } from "@/types/feedback-analytics-dashboard";

describe("Mission Control Phase 10.9.9 Feedback Analytics Dashboard", () => {
  it("publishes the feedback analytics dashboard contract", () => {
    const foundation = getFeedbackAnalyticsDashboardFoundation();

    expect(foundation.feedback_analytics_dashboard_version).toBe("feedback-analytics-dashboard/v1");
    expect(foundation.api_surface.retrieve_dashboard).toBe("POST /feedback-analytics-dashboard/dashboard");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.adaptive_proposal_generation_supported).toBe(false);
    expect(foundation.result.analytics_state).toBe("CERTIFIED");
  });

  it("renders deterministic dashboard analytics", () => {
    const first = renderFeedbackAnalyticsDashboard({ scenario: "BASELINE" });
    const second = renderFeedbackAnalyticsDashboard({ scenario: "BASELINE" });

    expect(first.panels.map((panel) => panel.panel_id)).toEqual(second.panels.map((panel) => panel.panel_id));
    expect(first.replay_explorer.integrity_hash).toBe(second.replay_explorer.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("renders all required dashboard panels", () => {
    const result = renderFeedbackAnalyticsDashboard();

    expect(result.panels.map((panel) => panel.panel_type)).toEqual([
      "FEEDBACK_VOLUME",
      "FEEDBACK_TYPES",
      "OVERRIDE_TRENDS",
      "REJECTION_TRENDS",
      "CONFIDENCE_TRENDS",
      "GOVERNANCE_FEEDBACK",
      "ADAPTATION_CANDIDATES",
      "REPLAY_EXPLORER",
    ]);
  });

  it.each([
    ["VOLUME_SPIKE", "FEEDBACK_VOLUME", "INCREASING"],
    ["OVERRIDE_TREND", "OVERRIDE_TRENDS", "INCREASING"],
    ["REJECTION_TREND", "REJECTION_TRENDS", "INCREASING"],
    ["CONFIDENCE_DRIFT", "CONFIDENCE_TRENDS", "DECREASING"],
    ["GOVERNANCE_HOTSPOT", "GOVERNANCE_FEEDBACK", "INCREASING"],
  ] as const)("shows %s in %s", (scenario, panelType, trend) => {
    const result = renderFeedbackAnalyticsDashboard({ scenario });
    const panel = result.panels.find((item) => item.panel_type === panelType);

    expect(panel?.metrics[0]?.trend_direction).toBe(trend);
    expect(panel?.metrics[0]?.evidence_refs.length).toBeGreaterThan(0);
    expect(panel?.metrics[0]?.replay_refs.length).toBeGreaterThan(0);
  });

  it("surfaces adaptation and simulation opportunities as advisory analytics", () => {
    const adaptation = renderFeedbackAnalyticsDashboard({ scenario: "ADAPTATION_CANDIDATE" });
    const simulation = renderFeedbackAnalyticsDashboard({ scenario: "SIMULATION_OPPORTUNITY" });

    expect(adaptation.panels.find((panel) => panel.panel_type === "ADAPTATION_CANDIDATES")?.metrics[0]?.value).toBe(6);
    expect(simulation.governance_result.escalation_decision.simulation_required).toBe(true);
    expect(adaptation.generates_adaptive_proposals).toBe(false);
    expect(simulation.executes_simulations).toBe(false);
  });

  it("provides explanations, evidence refs, replay refs, and governance considerations for every panel", () => {
    const result = renderFeedbackAnalyticsDashboard();

    expect(result.panels.every((panel) => panel.data_source)).toBe(true);
    expect(result.panels.every((panel) => panel.calculation_methodology)).toBe(true);
    expect(result.panels.every((panel) => panel.supporting_evidence.length > 0)).toBe(true);
    expect(result.panels.every((panel) => panel.replay_references.length > 0)).toBe(true);
    expect(result.panels.every((panel) => panel.governance_considerations.length > 0)).toBe(true);
    expect(result.explainable).toBe(true);
  });

  it("supports deterministic dashboard filters", () => {
    const result = renderFeedbackAnalyticsDashboard({
      filters: {
        mission_id: "mission-alpha",
        operator_id: "operator-alpha",
        date_range: "LAST_30_DAYS",
        governance_status: "VALIDATED",
        confidence_level: "HIGH",
      },
    });

    expect(result.filters.mission_id).toBe("mission-alpha");
    expect(result.filters.operator_id).toBe("operator-alpha");
    expect(result.filters.date_range).toBe("LAST_30_DAYS");
    expect(result.role_based_access_control).toBe(true);
  });

  it("provides replay explorer navigation", () => {
    const result = renderFeedbackAnalyticsDashboard();

    expect(result.replay_explorer.feedback_history_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.decision_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.recommendation_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.evidence_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.governance_review_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.certification_lineage_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.replayable).toBe(true);
  });

  it("keeps the dashboard observational and non-mutating", () => {
    const result = renderFeedbackAnalyticsDashboard();

    expect(result.observational_only).toBe(true);
    expect(result.modifies_feedback).toBe(false);
    expect(result.generates_adaptive_proposals).toBe(false);
    expect(result.changes_recommendations).toBe(false);
    expect(result.executes_simulations).toBe(false);
    expect(result.overrides_governance).toBe(false);
    expect(result.approves_adaptations).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
  });

  it.each([
    ["MISSING_EVIDENCE", "REQUIRED_EVIDENCE_UNAVAILABLE"],
    ["MISSING_REPLAY", "REPLAY_LINEAGE_INCOMPLETE"],
    ["MISSING_CALCULATION_RULES", "CALCULATION_RULES_MISSING"],
    ["INVALID_DASHBOARD_VERSION", "DASHBOARD_VERSION_INVALID"],
    ["MISSING_GOVERNANCE_METADATA", "GOVERNANCE_METADATA_INCOMPLETE"],
    ["TENANT_AMBIGUOUS", "TENANT_OWNERSHIP_AMBIGUOUS"],
    ["ROLE_DENIED", "ROLE_ACCESS_DENIED"],
    ["INVALID_FILTER", "FILTER_INVALID"],
    ["HIDDEN_VISUALIZATION", "HIDDEN_VISUALIZATION_DETECTED"],
    ["NONDETERMINISTIC_CALCULATION", "NONDETERMINISTIC_CALCULATION_DETECTED"],
    ["UNSUPPORTED_ANALYTICS", "UNSUPPORTED_ANALYTICS"],
    ["ORPHANED_METRIC", "ORPHANED_DASHBOARD_METRIC"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["FEEDBACK_MUTATION_ATTEMPT", "FEEDBACK_MUTATION_ATTEMPT"],
    ["ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT", "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT"],
    ["RECOMMENDATION_MUTATION_ATTEMPT", "RECOMMENDATION_MUTATION_ATTEMPT"],
    ["SIMULATION_EXECUTION_ATTEMPT", "SIMULATION_EXECUTION_ATTEMPT"],
    ["GOVERNANCE_OVERRIDE_ATTEMPT", "GOVERNANCE_OVERRIDE_ATTEMPT"],
    ["ADAPTATION_APPROVAL_ATTEMPT", "ADAPTATION_APPROVAL_ATTEMPT"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
  ] as readonly [FeedbackAnalyticsScenario, FeedbackAnalyticsFailure][])("fails deterministically for %s", (scenario, failure) => {
    const result = renderFeedbackAnalyticsDashboard({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.analytics_state).not.toBe("CERTIFIED");
    expect(result.observational_only).toBe(true);
    expect(result.changes_production_behavior).toBe(false);
  });

  it("keeps missing evidence pending", () => {
    const result = renderFeedbackAnalyticsDashboard({ scenario: "MISSING_EVIDENCE" });

    expect(result.analytics_state).toBe("PENDING_EVIDENCE");
    expect(result.evidence_traceable).toBe(false);
  });

  it("records dashboard audit metadata", () => {
    const result = renderFeedbackAnalyticsDashboard();
    const audit = result.audit_events[0];

    expect(audit?.dashboard_version).toBe("feedback-analytics-dashboard/v1");
    expect(audit?.analytics_version).toBe("feedback-analytics/v1");
    expect(audit?.calculation_version).toBe("feedback-dashboard-calculations/v1");
    expect(audit?.append_only).toBe(true);
    expect(audit?.immutable).toBe(true);
  });

  it("replays dashboard output and detects tampering", () => {
    const result = renderFeedbackAnalyticsDashboard();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayFeedbackAnalyticsDashboard(result)).toBe(true);
    expect(replayFeedbackAnalyticsDashboard(tampered)).toBe(false);
  });
});
