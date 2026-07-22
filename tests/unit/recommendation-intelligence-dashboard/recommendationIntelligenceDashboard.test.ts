import { describe, expect, it } from "vitest";
import {
  buildRecommendationIntelligenceDashboard,
  getRecommendationIntelligenceDashboardContract,
  replayRecommendationIntelligenceDashboard,
  validateRecommendationIntelligenceDashboard,
} from "@/services/recommendation-intelligence-dashboard";
import type { RecommendationDashboardFailure, RecommendationDashboardScenario, RecommendationDashboardWidget } from "@/types/recommendation-intelligence-dashboard";

describe("Mission Control Phase 10.14.3 Recommendation Intelligence Dashboard", () => {
  const widgets: readonly RecommendationDashboardWidget[] = [
    "Recommendation Funnel",
    "Acceptance Rate",
    "Failure Causes",
    "Override Analysis",
    "Recommendation History",
    "Quality Trend",
    "Effectiveness Trend",
    "Confidence Distribution",
    "Risk Heat Map",
    "Replay Explorer",
  ];

  it("publishes the recommendation dashboard contract", () => {
    const contract = getRecommendationIntelligenceDashboardContract();

    expect(contract.doctrine.version).toBe("recommendation-intelligence-dashboard/v10.14.3");
    expect(contract.doctrine.widgets).toEqual(widgets);
    expect(contract.doctrine.lifecycle_states).toHaveLength(8);
    expect(contract.doctrine.required_data_sources).toContain("Recommendation Effectiveness Engine");
    expect(contract.doctrine.required_data_sources).toContain("Certification Ledger");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("renders deterministic recommendation intelligence", () => {
    const first = buildRecommendationIntelligenceDashboard();
    const second = buildRecommendationIntelligenceDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.widgets).toEqual(widgets);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.recommendation_records.map((record) => record.integrity_hash)).toEqual(second.recommendation_records.map((record) => record.integrity_hash));
    expect(validateRecommendationIntelligenceDashboard(first).valid).toBe(true);
    expect(replayRecommendationIntelligenceDashboard(first)).toBe(true);
  });

  it("represents all required recommendation dashboard sections", () => {
    const result = buildRecommendationIntelligenceDashboard();

    expect(result.recommendation_records).toHaveLength(1);
    expect(result.recommendation_records[0].lifecycle_state).toBe("ACCEPTED");
    expect(result.lifecycle_dashboard.lifecycle_counts).toContain("ACCEPTED:1");
    expect(result.effectiveness_dashboard.effectiveness_score).toBe(0.91);
    expect(result.effectiveness_dashboard.recommendation_success_rate).toBe(1);
    expect(result.confidence_dashboard.prediction_accuracy).toBe(0.9);
    expect(result.risk_dashboard.mitigation_recommendations.length).toBeGreaterThan(0);
    expect(result.operator_dashboard.acceptance_rate).toBe(1);
    expect(result.quality_dashboard.recommendation_quality_score).toBeGreaterThan(0.9);
    expect(result.failure_dashboard.failure_frequency).toBe(0);
    expect(result.history_explorer.chronological_records).toHaveLength(1);
    expect(result.replay_explorer).toHaveLength(1);
    expect(result.trend_dashboard.certification_success).toBe(1);
  });

  it("links recommendations to evidence, replay, governance, operator, lineage, and certification records", () => {
    const result = buildRecommendationIntelligenceDashboard();
    const record = result.recommendation_records[0];

    expect(record.evidence_refs.length).toBeGreaterThan(0);
    expect(record.governance_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.lineage_refs.length).toBeGreaterThan(0);
    expect(result.history_explorer.operator_decision_refs.length).toBeGreaterThan(0);
    expect(result.history_explorer.certification_history_refs.length).toBeGreaterThan(0);
    expect(result.replay_explorer.every((replay) => replay.supporting_evidence_refs.length > 0)).toBe(true);
    expect(result.replay_explorer.every((replay) => replay.governance_review_refs.length > 0)).toBe(true);
    expect(result.replay_explorer.every((replay) => replay.certification_record_refs.length > 0)).toBe(true);
  });

  it("enforces role visibility, tenant isolation, restricted fields, and read-only behavior", () => {
    const result = buildRecommendationIntelligenceDashboard();

    expect(result.permissions.every((permission) => permission.allowed)).toBe(true);
    expect(result.permissions.every((permission) => permission.tenant_isolated)).toBe(true);
    expect(result.permissions.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
    expect(result.permissions.every((permission) => permission.evidence_authorized && permission.replay_authorized)).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.api_surface.creation_supported).toBe(false);
    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.governance_decision_supported).toBe(false);
    expect(result.api_surface.operator_action_supported).toBe(false);
    expect(result.read_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.write_authority_granted).toBe(false);
  });

  it("records observability and validation coverage", () => {
    const result = buildRecommendationIntelligenceDashboard();

    expect(result.validation_tests).toHaveLength(15);
    expect(result.validation_tests.every((test) => test.passed)).toBe(true);
    expect(result.metrics.rendering_latency_ms).toBe(10);
    expect(result.metrics.missing_recommendation_records).toBe(0);
    expect(result.metrics.broken_evidence_references).toBe(0);
    expect(result.metrics.replay_resolution_failures).toBe(0);
    expect(result.metrics.unauthorized_access_attempts).toBe(0);
  });

  it.each([
    ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
    ["RECOMMENDATION_HIDDEN", "RECOMMENDATION_RECORD_HIDDEN"],
    ["RECOMMENDATION_DELETED", "RECOMMENDATION_RECORD_DELETED"],
    ["NONDETERMINISTIC_RENDERING", "RECOMMENDATION_RENDERING_NONDETERMINISTIC"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_BROKEN"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_LINEAGE_MISSING"],
    ["MISSING_OPERATOR_HISTORY", "OPERATOR_DECISION_HISTORY_MISSING"],
    ["QUALITY_CALCULATION_DRIFT", "QUALITY_CALCULATION_NONDETERMINISTIC"],
    ["TREND_DRIFT", "TREND_ANALYSIS_NONDETERMINISTIC"],
    ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
    ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["WRITE_AUTHORITY_EXPOSED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"],
  ] as const)("fails closed for %s", (scenario: RecommendationDashboardScenario, failure: RecommendationDashboardFailure) => {
    const result = buildRecommendationIntelligenceDashboard({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validateRecommendationIntelligenceDashboard(result).valid).toBe(false);
    expect(replayRecommendationIntelligenceDashboard(result)).toBe(false);
  });

  it("detects nested recommendation record tampering", () => {
    const result = buildRecommendationIntelligenceDashboard();
    const tampered = {
      ...result,
      recommendation_records: [
        {
          ...result.recommendation_records[0],
          tenant_id: "tenant-cross-boundary",
        },
      ],
    };

    expect(validateRecommendationIntelligenceDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayRecommendationIntelligenceDashboard(tampered)).toBe(false);
  });
});
