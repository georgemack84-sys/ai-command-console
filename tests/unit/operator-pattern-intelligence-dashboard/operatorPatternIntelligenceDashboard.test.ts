import { describe, expect, it } from "vitest";
import {
  computePatternDashboardElementHash,
  getOperatorPatternDashboardFoundation,
  renderOperatorPatternDashboard,
  replayOperatorPatternDashboard,
} from "@/services/operator-pattern-intelligence-dashboard";
import type { PatternDashboardFailure, PatternDashboardScenario } from "@/types/operator-pattern-intelligence-dashboard";

describe("Mission Control Phase 10.4.9 Operator Pattern Intelligence Dashboard", () => {
  it("publishes the operator pattern dashboard foundation", () => {
    const foundation = getOperatorPatternDashboardFoundation();

    expect(foundation.operator_pattern_intelligence_dashboard_version).toBe("operator-pattern-intelligence-dashboard/v1");
    expect(foundation.api_surface.retrieve_dashboard).toBe("POST /operator-pattern-intelligence-dashboard/dashboard");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("renders identical dashboard views deterministically", () => {
    const first = renderOperatorPatternDashboard();
    const second = renderOperatorPatternDashboard();

    expect(first.dashboard_view.dashboard_view_id).toBe(second.dashboard_view.dashboard_view_id);
    expect(first.pattern_elements.map((element) => element.element_id)).toEqual(second.pattern_elements.map((element) => element.element_id));
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("renders complete pattern, trend, evidence, replay, governance, and mission coverage", () => {
    const result = renderOperatorPatternDashboard();

    expect(result.dashboard_view.visible_pattern_refs.length).toBeGreaterThan(0);
    expect(result.dashboard_view.visible_trend_refs.length).toBeGreaterThan(0);
    expect(result.dashboard_view.visible_governance_refs.length).toBeGreaterThan(0);
    expect(result.dashboard_view.visible_replay_refs.length).toBeGreaterThan(0);
    expect(result.dashboard_view.visible_evidence_refs.length).toBeGreaterThan(0);
    expect(result.pattern_elements).toHaveLength(9);
  });

  it("displays recommendation, risk, confidence, governance, and mission views", () => {
    const recommendation = renderOperatorPatternDashboard({ scenario: "RECOMMENDATION_FAILURE" }).recommendation_viewer.elements[0];
    const risk = renderOperatorPatternDashboard({ scenario: "RISK_UNDERESTIMATION" }).risk_dashboard.elements[0];
    const confidence = renderOperatorPatternDashboard({ scenario: "CONFIDENCE_DRIFT" }).confidence_dashboard.elements[0];
    const governance = renderOperatorPatternDashboard({ scenario: "GOVERNANCE_BLOCKER" }).governance_view.elements[0];
    const mission = renderOperatorPatternDashboard({ scenario: "MISSION_BOTTLENECK" }).mission_dashboard.elements[0];

    expect(recommendation.title).toContain("recommendation failure");
    expect(risk.title).toContain("Risk underestimation");
    expect(confidence.title).toContain("Confidence calibration");
    expect(governance.title).toContain("Governance blocker");
    expect(mission.title).toContain("Mission bottleneck");
  });

  it("shows recurring recommendation successes as improving trends", () => {
    const result = renderOperatorPatternDashboard({ scenario: "RECOMMENDATION_SUCCESS" });
    const element = result.recommendation_viewer.elements[0];

    expect(element.title).toContain("recommendation success");
    expect(element.trend_direction).toBe("IMPROVING");
    expect(element.evidence_refs.length).toBeGreaterThan(0);
    expect(element.replay_available).toBe(true);
  });

  it("provides replay access and explanations for every displayed element", () => {
    const result = renderOperatorPatternDashboard();

    expect(result.pattern_elements.every((element) => element.replay_available)).toBe(true);
    expect(result.pattern_elements.every((element) => element.explanation.length > 0)).toBe(true);
    expect(result.pattern_elements.every((element) => element.evidence_refs.length > 0)).toBe(true);
    expect(result.pattern_elements.every((element) => element.explanation_refs.length > 0)).toBe(true);
  });

  it("keeps dashboard advisory-only and non-mutating", () => {
    const result = renderOperatorPatternDashboard();

    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_actions).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.modifies_governance).toBe(false);
    expect(result.modifies_priorities).toBe(false);
    expect(result.workflow_execution).toBe(false);
  });

  it("creates stable element hashes and replayable dashboard output", () => {
    const result = renderOperatorPatternDashboard();
    const element = result.pattern_elements[0];

    expect(computePatternDashboardElementHash(element)).toBe(element.integrity_hash);
    expect(replayOperatorPatternDashboard(result)).toBe(true);
  });

  it("applies deterministic operator filters", () => {
    const result = renderOperatorPatternDashboard({
      filters: {
        operator_id: "operator-alpha",
        timeframe: "LAST_90_DAYS",
        confidence_min: 0.1,
        confidence_max: 0.9,
      },
    });

    expect(result.dashboard_view.operator_id).toBe("operator-alpha");
    expect(result.dashboard_view.applied_filters.timeframe).toBe("LAST_90_DAYS");
    expect(result.validation.filters_valid).toBe(true);
  });

  it.each([
    ["MISSING_REPLAY_INPUT", "REPLAY_INPUT_MISSING"],
    ["UNCERTIFIED_REPLAY_INPUT", "REPLAY_INPUT_UNCERTIFIED"],
    ["MISSING_REPLAY", "REPLAY_UNAVAILABLE"],
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["INVALID_PATTERN_INTELLIGENCE", "PATTERN_INTELLIGENCE_INVALID"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["INVALID_FILTER", "FILTER_INVALID"],
    ["ROLE_DENIED", "ROLE_ACCESS_DENIED"],
    ["HIDDEN_VISUALIZATION", "HIDDEN_VISUALIZATION_DETECTED"],
    ["NONDETERMINISTIC_RENDERING", "NONDETERMINISTIC_RENDERING_DETECTED"],
    ["AUTONOMOUS_ACTION", "AUTONOMOUS_ACTION_DETECTED"],
    ["RECOMMENDATION_MUTATION", "RECOMMENDATION_MUTATION_DETECTED"],
    ["GOVERNANCE_MUTATION", "GOVERNANCE_MUTATION_DETECTED"],
    ["PRIORITY_MUTATION", "PRIORITY_MUTATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternDashboardScenario, PatternDashboardFailure][])("fails closed for %s", (scenario, failure) => {
    const result = renderOperatorPatternDashboard({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.workflow_execution).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = renderOperatorPatternDashboard({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects dashboard tampering during replay", () => {
    const result = renderOperatorPatternDashboard();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorPatternDashboard(tampered)).toBe(false);
  });
});
