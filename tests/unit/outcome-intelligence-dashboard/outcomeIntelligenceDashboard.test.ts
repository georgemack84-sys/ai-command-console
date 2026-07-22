import { describe, expect, it } from "vitest";
import {
  buildOutcomeIntelligenceDashboard,
  getOutcomeIntelligenceDashboardContract,
  replayOutcomeIntelligenceDashboard,
  validateOutcomeIntelligenceDashboard,
} from "@/services/outcome-intelligence-dashboard";
import type { OutcomeDashboardFailure, OutcomeDashboardScenario, OutcomeDashboardWidget } from "@/types/outcome-intelligence-dashboard";

describe("Mission Control Phase 10.14.2 Outcome Intelligence Dashboard", () => {
  const widgets: readonly OutcomeDashboardWidget[] = [
    "Success Rate",
    "Failure Timeline",
    "Mission Impact",
    "Confidence Accuracy",
    "Risk Actualization",
    "Outcome Distribution",
    "Outcome History",
    "Rollback Timeline",
    "Governance Replay",
    "Historical Comparison",
  ];

  it("publishes the authoritative outcome dashboard contract", () => {
    const contract = getOutcomeIntelligenceDashboardContract();

    expect(contract.doctrine.version).toBe("outcome-intelligence-dashboard/v10.14.2");
    expect(contract.doctrine.widgets).toEqual(widgets);
    expect(contract.doctrine.outcome_categories).toHaveLength(10);
    expect(contract.doctrine.required_data_sources).toContain("Outcome Observation Engine");
    expect(contract.doctrine.required_data_sources).toContain("Outcome Ledger");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("renders deterministic outcome intelligence sections", () => {
    const first = buildOutcomeIntelligenceDashboard();
    const second = buildOutcomeIntelligenceDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.widgets).toEqual(widgets);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.recent_outcomes.map((item) => item.integrity_hash)).toEqual(second.recent_outcomes.map((item) => item.integrity_hash));
    expect(validateOutcomeIntelligenceDashboard(first).valid).toBe(true);
    expect(replayOutcomeIntelligenceDashboard(first)).toBe(true);
  });

  it("represents all required dashboard panels", () => {
    const result = buildOutcomeIntelligenceDashboard();

    expect(result.recent_outcomes).toHaveLength(1);
    expect(result.timeline_explorer).toHaveLength(6);
    expect(result.success_trends.success_percentage).toBe(100);
    expect(result.failure_trends.failure_percentage).toBe(0);
    expect(result.mission_impact.objective_completion).toBe(1);
    expect(result.outcome_categories.categories).toHaveLength(10);
    expect(result.confidence_realization.confidence_calibration).toBeGreaterThan(0.9);
    expect(result.risk_realization.mitigation_effectiveness).toBeGreaterThan(0.8);
    expect(result.governance_outcomes.governance_approvals).toBe(1);
    expect(result.rollback_outcomes.rollback_completeness).toBe(1);
    expect(result.historical_comparison.dimensions).toHaveLength(9);
  });

  it("links every displayed outcome to evidence, governance, replay, ledger, truth, and certification records", () => {
    const result = buildOutcomeIntelligenceDashboard();

    expect(result.recent_outcomes.every((outcome) => outcome.evidence_refs.length > 0)).toBe(true);
    expect(result.recent_outcomes.every((outcome) => outcome.governance_refs.length > 0)).toBe(true);
    expect(result.recent_outcomes.every((outcome) => outcome.replay_refs.length > 0)).toBe(true);
    expect(result.replay_integration.every((link) => link.evidence_lineage_ref)).toBe(true);
    expect(result.replay_integration.every((link) => link.governance_lineage_ref)).toBe(true);
    expect(result.replay_integration.every((link) => link.certification_record_ref)).toBe(true);
    expect(result.replay_integration.every((link) => link.outcome_ledger_ref)).toBe(true);
    expect(result.replay_integration.every((link) => link.truth_ledger_ref)).toBe(true);
  });

  it("enforces role visibility, tenant isolation, restricted fields, and read-only behavior", () => {
    const result = buildOutcomeIntelligenceDashboard();

    expect(result.permissions.every((permission) => permission.allowed)).toBe(true);
    expect(result.permissions.every((permission) => permission.tenant_isolated)).toBe(true);
    expect(result.permissions.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
    expect(result.permissions.every((permission) => permission.evidence_authorized && permission.replay_authorized)).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.recalculation_supported).toBe(false);
    expect(result.api_surface.governance_decision_supported).toBe(false);
    expect(result.read_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.write_authority_granted).toBe(false);
  });

  it("records observability and validation coverage", () => {
    const result = buildOutcomeIntelligenceDashboard();

    expect(result.validation_tests).toHaveLength(15);
    expect(result.validation_tests.every((test) => test.passed)).toBe(true);
    expect(result.metrics.rendering_health).toBe("HEALTHY");
    expect(result.metrics.missing_outcome_records).toBe(0);
    expect(result.metrics.broken_evidence_references).toBe(0);
    expect(result.metrics.replay_resolution_failures).toBe(0);
    expect(result.metrics.unauthorized_access_attempts).toBe(0);
  });

  it.each([
    ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
    ["OUTCOME_HIDDEN", "OUTCOME_RECORD_HIDDEN"],
    ["OUTCOME_OMITTED", "OUTCOME_RECORD_OMITTED"],
    ["NONDETERMINISTIC_RENDERING", "OUTCOME_RENDERING_NONDETERMINISTIC"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_BROKEN"],
    ["MISSING_REPLAY", "REPLAY_REFERENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_LINEAGE_MISSING"],
    ["ROLLBACK_HISTORY_MISSING", "ROLLBACK_HISTORY_MISSING"],
    ["COMPARISON_DRIFT", "HISTORICAL_COMPARISON_NONDETERMINISTIC"],
    ["STALE_VISUALIZATION", "STALE_VISUALIZATION_DETECTED"],
    ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
    ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["WRITE_AUTHORITY_EXPOSED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"],
  ] as const)("fails closed for %s", (scenario: OutcomeDashboardScenario, failure: OutcomeDashboardFailure) => {
    const result = buildOutcomeIntelligenceDashboard({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validateOutcomeIntelligenceDashboard(result).valid).toBe(false);
    expect(replayOutcomeIntelligenceDashboard(result)).toBe(false);
  });

  it("detects nested outcome record tampering", () => {
    const result = buildOutcomeIntelligenceDashboard();
    const tampered = {
      ...result,
      recent_outcomes: [
        {
          ...result.recent_outcomes[0],
          tenant_id: "tenant-cross-boundary",
        },
      ],
    };

    expect(validateOutcomeIntelligenceDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayOutcomeIntelligenceDashboard(tampered)).toBe(false);
  });
});
