import { describe, expect, it } from "vitest";
import {
  buildStrategyEvolutionDashboard,
  getStrategyEvolutionDashboardContract,
  replayStrategyEvolutionDashboard,
  validateStrategyEvolutionDashboard,
} from "@/services/strategy-evolution-dashboard";
import type { StrategyEvolutionDashboardFailure, StrategyEvolutionDashboardScenario, StrategyEvolutionWidget } from "@/types/strategy-evolution-dashboard";

describe("Mission Control Phase 10.14.5 Strategy Evolution Dashboard", () => {
  const widgets: readonly StrategyEvolutionWidget[] = [
    "Proposal Queue",
    "Strategy Comparison",
    "Simulation Progress",
    "Approval Progress",
    "Expected Improvement",
    "Historical Comparison",
    "Expected Risk",
    "Governance Implications",
    "Replay Readiness",
    "Rollback Readiness",
    "Lineage Explorer",
    "Alert Panel",
  ];

  it("publishes the strategy evolution dashboard contract", () => {
    const contract = getStrategyEvolutionDashboardContract();

    expect(contract.doctrine.version).toBe("strategy-evolution-dashboard/v10.14.5");
    expect(contract.doctrine.widgets).toEqual(widgets);
    expect(contract.doctrine.proposal_statuses).toContain("CONDITIONALLY_CERTIFIED");
    expect(contract.doctrine.proposal_statuses).toContain("ROLLBACK_REQUIRED");
    expect(contract.doctrine.navigation_dimensions).toContain("strategy proposal ID");
    expect(contract.doctrine.required_data_sources).toContain("Strategy Evolution Engine");
    expect(contract.doctrine.required_data_sources).toContain("Certification Ledger");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("renders deterministic strategy evolution intelligence", () => {
    const first = buildStrategyEvolutionDashboard();
    const second = buildStrategyEvolutionDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.widgets).toEqual(widgets);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.records.map((record) => record.integrity_hash)).toEqual(second.records.map((record) => record.integrity_hash));
    expect(validateStrategyEvolutionDashboard(first).valid).toBe(true);
    expect(replayStrategyEvolutionDashboard(first)).toBe(true);
  });

  it("represents all required strategy dashboard sections", () => {
    const result = buildStrategyEvolutionDashboard();

    expect(result.records).toHaveLength(1);
    expect(result.records[0].proposal_status).toBe("CERTIFIED");
    expect(result.proposal_queue.sorted_proposal_refs).toHaveLength(1);
    expect(result.detail_view.traceability_refs.length).toBeGreaterThan(0);
    expect(result.comparison_workspace.comparison_dimensions).toContain("rollback complexity");
    expect(result.benefit_dashboard.expected_targets.length).toBeGreaterThan(0);
    expect(result.risk_dashboard.risk_categories).toContain("rollback");
    expect(result.governance_view.outcome).toBe("COMPLIANT");
    expect(result.simulation_view.status).toBe("COMPLETED");
    expect(result.approval_view.silence_treated_as_approval).toBe(false);
    expect(result.certification_view.outcome).toBe("PASS");
    expect(result.replay_view.status).toBe("READY");
    expect(result.rollback_view.status).toBe("READY");
    expect(result.historical_explorer.replayable).toBe(true);
    expect(result.alert_panel.critical_alerts_visible).toBe(true);
    expect(result.lineage_explorer.certification_lineage.length).toBeGreaterThan(0);
  });

  it("links proposals to evidence, governance, simulation, approval, certification, replay, rollback, and lineage", () => {
    const result = buildStrategyEvolutionDashboard();
    const record = result.records[0];

    expect(record.supporting_pattern_refs.length).toBeGreaterThan(0);
    expect(record.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(record.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(record.governance_implications.length).toBeGreaterThan(0);
    expect(record.simulation_refs.length).toBeGreaterThan(0);
    expect(record.approval_refs.length).toBeGreaterThan(0);
    expect(record.certification_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.rollback_plan_ref).toBeTruthy();
    expect(result.lineage_explorer.rollback_lineage).toContain(record.rollback_plan_ref);
  });

  it("enforces role visibility, tenant isolation, restricted fields, and read-only behavior", () => {
    const result = buildStrategyEvolutionDashboard();

    expect(result.permissions.every((permission) => permission.allowed)).toBe(true);
    expect(result.permissions.every((permission) => permission.tenant_isolated)).toBe(true);
    expect(result.permissions.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
    expect(result.permissions.every((permission) => permission.evidence_authorized && permission.governance_authorized && permission.replay_authorized && permission.certification_authorized)).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.api_surface.creation_supported).toBe(false);
    expect(result.api_surface.mutation_supported).toBe(false);
    expect(result.api_surface.strategy_mutation_supported).toBe(false);
    expect(result.api_surface.proposal_approval_supported).toBe(false);
    expect(result.api_surface.simulation_execution_supported).toBe(false);
    expect(result.api_surface.certification_mutation_supported).toBe(false);
    expect(result.api_surface.rollback_execution_supported).toBe(false);
    expect(result.api_surface.production_promotion_supported).toBe(false);
    expect(result.read_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.write_authority_granted).toBe(false);
  });

  it("records observability and validation coverage", () => {
    const result = buildStrategyEvolutionDashboard();

    expect(result.validation_tests).toHaveLength(21);
    expect(result.validation_tests.every((test) => test.passed)).toBe(true);
    expect(result.metrics.proposal_sync_latency_ms).toBe(16);
    expect(result.metrics.missing_evidence_references).toBe(0);
    expect(result.metrics.broken_simulation_links).toBe(0);
    expect(result.metrics.replay_resolution_failures).toBe(0);
    expect(result.metrics.rollback_status_inconsistencies).toBe(0);
    expect(result.metrics.hidden_state_discrepancies).toBe(0);
  });

  it("keeps conditional certification visibly blocked from production readiness", () => {
    const result = buildStrategyEvolutionDashboard({ scenario: "CONDITIONAL_CERTIFICATION" });

    expect(result.records[0].certification_status).toBe("CONDITIONAL_PASS");
    expect(result.certification_view.production_ready).toBe(false);
    expect(result.failures).toContain("CONDITIONAL_CERTIFICATION_MISREPRESENTED");
    expect(validateStrategyEvolutionDashboard(result).valid).toBe(false);
  });

  it.each([
    ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
    ["PROPOSAL_HIDDEN", "STRATEGY_PROPOSAL_HIDDEN"],
    ["PROPOSAL_DELETED", "STRATEGY_PROPOSAL_DELETED"],
    ["NONDETERMINISTIC_RENDERING", "STRATEGY_RENDERING_NONDETERMINISTIC"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_BROKEN"],
    ["MISSING_BENEFIT", "EXPECTED_BENEFIT_UNSUPPORTED"],
    ["MISSING_RISK", "EXPECTED_RISK_HIDDEN"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_IMPLICATION_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_IMPLICATION_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_STATUS_UNAVAILABLE"],
    ["MISSING_APPROVAL", "APPROVAL_STATUS_UNAVAILABLE"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_STATUS_INCONSISTENT"],
    ["CONDITIONAL_CERTIFICATION", "CONDITIONAL_CERTIFICATION_MISREPRESENTED"],
    ["MISSING_REPLAY", "REPLAY_READINESS_UNAVAILABLE"],
    ["MISSING_ROLLBACK", "ROLLBACK_READINESS_UNAVAILABLE"],
    ["HIDDEN_PROGRESS", "HIDDEN_STRATEGIC_PROGRESSION"],
    ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
    ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["WRITE_AUTHORITY_EXPOSED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"],
  ] as const)("fails closed for %s", (scenario: StrategyEvolutionDashboardScenario, failure: StrategyEvolutionDashboardFailure) => {
    const result = buildStrategyEvolutionDashboard({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validateStrategyEvolutionDashboard(result).valid).toBe(false);
    expect(replayStrategyEvolutionDashboard(result)).toBe(false);
  });

  it("detects nested strategy proposal record tampering", () => {
    const result = buildStrategyEvolutionDashboard();
    const tampered = {
      ...result,
      records: [
        {
          ...result.records[0],
          tenant_id: "tenant-cross-boundary",
        },
      ],
    };

    expect(validateStrategyEvolutionDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayStrategyEvolutionDashboard(tampered)).toBe(false);
  });
});
