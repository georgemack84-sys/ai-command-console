import { describe, expect, it } from "vitest";
import {
  buildPatternIntelligenceDashboard,
  getPatternIntelligenceDashboardContract,
  replayPatternIntelligenceDashboard,
  validatePatternIntelligenceDashboard,
} from "@/services/pattern-intelligence-dashboard";
import type { PatternIntelligenceDashboardFailure, PatternIntelligenceDashboardScenario, PatternIntelligenceWidget } from "@/types/pattern-intelligence-dashboard";

describe("Mission Control Phase 10.14.4 Pattern Intelligence Dashboard", () => {
  const widgets: readonly PatternIntelligenceWidget[] = [
    "Pattern Timeline",
    "Pattern Graph",
    "Mission Heatmap",
    "Evidence Viewer",
    "Confidence Distribution",
    "Strategic Impact",
    "Recurrence Trend",
    "Replay Explorer",
    "Governance Impact",
    "Operator Impact",
  ];

  it("publishes the pattern intelligence dashboard contract", () => {
    const contract = getPatternIntelligenceDashboardContract();

    expect(contract.doctrine.version).toBe("pattern-intelligence-dashboard/v10.14.4");
    expect(contract.doctrine.widgets).toEqual(widgets);
    expect(contract.doctrine.navigation_dimensions).toContain("pattern ID");
    expect(contract.doctrine.navigation_dimensions).toContain("certification status");
    expect(contract.doctrine.required_data_sources).toContain("Pattern Intelligence Engine");
    expect(contract.doctrine.required_data_sources).toContain("Certification Ledger");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("renders deterministic pattern intelligence", () => {
    const first = buildPatternIntelligenceDashboard();
    const second = buildPatternIntelligenceDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.widgets).toEqual(widgets);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.pattern_records.map((record) => record.integrity_hash)).toEqual(second.pattern_records.map((record) => record.integrity_hash));
    expect(validatePatternIntelligenceDashboard(first).valid).toBe(true);
    expect(replayPatternIntelligenceDashboard(first)).toBe(true);
  });

  it("represents all required pattern dashboard sections", () => {
    const result = buildPatternIntelligenceDashboard();

    expect(result.pattern_records).toHaveLength(1);
    expect(result.pattern_records[0].current_status).toBe("CERTIFIED");
    expect(result.timeline_explorer.chronological_pattern_refs).toHaveLength(1);
    expect(result.relationship_graph.pattern_nodes).toHaveLength(1);
    expect(result.mission_analytics.affected_missions).toHaveLength(1);
    expect(result.confidence_dashboard.confidence_level).toBeGreaterThan(0.7);
    expect(result.strategic_impact_dashboard.strategy_evolution_candidates).toHaveLength(1);
    expect(result.governance_impact_dashboard.governance_lineage_refs.length).toBeGreaterThan(0);
    expect(result.evidence_explorer.supporting_observations.length).toBeGreaterThan(0);
    expect(result.operator_impact_dashboard.affected_operators).toContain("operator-pattern-intelligence-reviewer");
    expect(result.proposed_response_dashboard.proposed_responses).toHaveLength(1);
    expect(result.replay_explorer).toHaveLength(1);
    expect(result.trend_analytics.pattern_persistence_score).toBeGreaterThan(0);
  });

  it("links patterns to evidence, replay, governance, certification, lineage, mission, and proposed responses", () => {
    const result = buildPatternIntelligenceDashboard();
    const record = result.pattern_records[0];

    expect(record.evidence_refs.length).toBeGreaterThan(0);
    expect(record.governance_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.certification_refs.length).toBeGreaterThan(0);
    expect(record.lineage_refs.length).toBeGreaterThan(0);
    expect(result.relationship_graph.shared_evidence_refs.length).toBeGreaterThan(0);
    expect(result.evidence_explorer.linked_recommendations.length).toBeGreaterThan(0);
    expect(result.replay_explorer.every((replay) => replay.certification_record_refs.length > 0)).toBe(true);
    expect(result.proposed_response_dashboard.proposal_lineage_refs.length).toBeGreaterThan(0);
  });

  it("enforces role visibility, tenant isolation, restricted fields, and read-only behavior", () => {
    const result = buildPatternIntelligenceDashboard();

    expect(result.permissions.every((permission) => permission.allowed)).toBe(true);
    expect(result.permissions.every((permission) => permission.tenant_isolated)).toBe(true);
    expect(result.permissions.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
    expect(result.permissions.every((permission) => permission.evidence_authorized && permission.replay_authorized && permission.certification_authorized)).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.api_surface.creation_supported).toBe(false);
    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.pattern_creation_supported).toBe(false);
    expect(result.api_surface.classification_mutation_supported).toBe(false);
    expect(result.api_surface.confidence_mutation_supported).toBe(false);
    expect(result.api_surface.governance_decision_supported).toBe(false);
    expect(result.api_surface.operator_action_supported).toBe(false);
    expect(result.read_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.write_authority_granted).toBe(false);
  });

  it("records observability and validation coverage", () => {
    const result = buildPatternIntelligenceDashboard();

    expect(result.validation_tests).toHaveLength(16);
    expect(result.validation_tests.every((test) => test.passed)).toBe(true);
    expect(result.metrics.rendering_latency_ms).toBe(11);
    expect(result.metrics.missing_pattern_records).toBe(0);
    expect(result.metrics.broken_evidence_references).toBe(0);
    expect(result.metrics.replay_resolution_failures).toBe(0);
    expect(result.metrics.graph_rendering_failures).toBe(0);
    expect(result.metrics.unauthorized_access_attempts).toBe(0);
  });

  it.each([
    ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
    ["PATTERN_HIDDEN", "PATTERN_RECORD_HIDDEN"],
    ["PATTERN_DELETED", "PATTERN_RECORD_DELETED"],
    ["NONDETERMINISTIC_RENDERING", "PATTERN_RENDERING_NONDETERMINISTIC"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_BROKEN"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_LINEAGE_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_LINEAGE_MISSING"],
    ["GRAPH_DRIFT", "GRAPH_RENDERING_NONDETERMINISTIC"],
    ["RECURRENCE_DRIFT", "RECURRENCE_CALCULATION_NONDETERMINISTIC"],
    ["CONFIDENCE_DRIFT", "CONFIDENCE_VISUALIZATION_NONDETERMINISTIC"],
    ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
    ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["WRITE_AUTHORITY_EXPOSED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"],
  ] as const)("fails closed for %s", (scenario: PatternIntelligenceDashboardScenario, failure: PatternIntelligenceDashboardFailure) => {
    const result = buildPatternIntelligenceDashboard({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validatePatternIntelligenceDashboard(result).valid).toBe(false);
    expect(replayPatternIntelligenceDashboard(result)).toBe(false);
  });

  it("detects nested pattern record tampering", () => {
    const result = buildPatternIntelligenceDashboard();
    const tampered = {
      ...result,
      pattern_records: [
        {
          ...result.pattern_records[0],
          tenant_id: "tenant-cross-boundary",
        },
      ],
    };

    expect(validatePatternIntelligenceDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayPatternIntelligenceDashboard(tampered)).toBe(false);
  });
});
