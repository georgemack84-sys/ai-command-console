import { describe, expect, it } from "vitest";
import { generateRiskAdaptationDashboards, getRiskAdaptationDashboardFoundation, replayRiskAdaptationDashboards } from "@/services/risk-adaptation-dashboards";
import type { RiskAdaptationDashboardFailure, RiskAdaptationDashboardScenario } from "@/types/risk-adaptation-dashboards";

describe("Mission Control Phase 10.7.9 Risk Adaptation Dashboards", () => {
  it("publishes the risk adaptation dashboard foundation", () => {
    const foundation = getRiskAdaptationDashboardFoundation();

    expect(foundation.risk_adaptation_dashboards_version).toBe("risk-adaptation-dashboards/v1");
    expect(foundation.api_surface.retrieve_overview).toBe("POST /risk-adaptation-dashboards/overview");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("generates dashboards deterministically", () => {
    const first = generateRiskAdaptationDashboards({ scenario: "OVERVIEW" });
    const second = generateRiskAdaptationDashboards({ scenario: "OVERVIEW" });

    expect(first.records[0].dashboard_record_id).toBe(second.records[0].dashboard_record_id);
    expect(first.records[0].accuracy_metrics.adaptation_health_score).toBe(second.records[0].accuracy_metrics.adaptation_health_score);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("exposes every required dashboard view", () => {
    const result = generateRiskAdaptationDashboards();

    expect(result.views.map((view) => view.dashboard_kind)).toEqual([
      "OVERVIEW",
      "RISK_DRIFT",
      "SEVERITY_CALIBRATION",
      "RISK_PATTERN",
      "GOVERNANCE",
      "SIMULATION",
      "REPLAY",
      "TENANT",
      "EXECUTIVE_REPORTING",
    ]);
  });

  it("maps scenarios to dashboard kinds", () => {
    expect(generateRiskAdaptationDashboards({ scenario: "DRIFT" }).records[0].dashboard_kind).toBe("RISK_DRIFT");
    expect(generateRiskAdaptationDashboards({ scenario: "CALIBRATION" }).records[0].dashboard_kind).toBe("SEVERITY_CALIBRATION");
    expect(generateRiskAdaptationDashboards({ scenario: "PATTERN" }).records[0].dashboard_kind).toBe("RISK_PATTERN");
    expect(generateRiskAdaptationDashboards({ scenario: "GOVERNANCE" }).records[0].dashboard_kind).toBe("GOVERNANCE");
    expect(generateRiskAdaptationDashboards({ scenario: "SIMULATION" }).records[0].dashboard_kind).toBe("SIMULATION");
    expect(generateRiskAdaptationDashboards({ scenario: "REPLAY" }).records[0].dashboard_kind).toBe("REPLAY");
    expect(generateRiskAdaptationDashboards({ scenario: "TENANT" }).records[0].dashboard_kind).toBe("TENANT");
    expect(generateRiskAdaptationDashboards({ scenario: "EXECUTIVE" }).records[0].dashboard_kind).toBe("EXECUTIVE_REPORTING");
  });

  it("computes deterministic operational and executive metrics", () => {
    const result = generateRiskAdaptationDashboards({ scenario: "EXECUTIVE" });
    const metrics = result.records[0].accuracy_metrics;

    expect(metrics.total_proposals).toBeGreaterThan(0);
    expect(metrics.approval_rate).toBeGreaterThan(0);
    expect(metrics.simulation_completion_rate).toBeGreaterThan(0);
    expect(result.executive_report.certification_readiness_summary).toContain("Certification readiness");
  });

  it("keeps dashboards read-only", () => {
    const result = generateRiskAdaptationDashboards({ scenario: "TENANT" });
    const record = result.records[0];

    expect(result.read_only).toBe(true);
    expect(record.read_only).toBe(true);
    expect(result.mutates_operational_data).toBe(false);
    expect(result.mutates_historical_records).toBe(false);
    expect(record.overrides_operator_authority).toBe(false);
  });

  it("indexes dashboard views in a read-only immutable ledger", () => {
    const result = generateRiskAdaptationDashboards({ scenario: "SIMULATION" });

    expect(result.ledger.read_only).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.deleted).toBe(false);
    expect(result.ledger.dashboard_index.SIMULATION.length).toBe(1);
  });

  it("replays dashboard generation", () => {
    const result = generateRiskAdaptationDashboards({ scenario: "OVERVIEW" });

    expect(replayRiskAdaptationDashboards(result)).toBe(true);
  });

  it.each([
    ["MISSING_SOURCE", "SOURCE_DATA_MISSING"],
    ["MISSING_METRICS", "DETERMINISTIC_METRICS_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_ATTRIBUTION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_LINKAGE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_COMPLIANCE_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_COMPLIANCE_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["BROKEN_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["UNAUTHORIZED_TENANT", "UNAUTHORIZED_TENANT_VISIBILITY"],
    ["OPERATIONAL_MUTATION", "OPERATIONAL_DATA_MUTATION_DETECTED"],
    ["HISTORICAL_MUTATION", "HISTORICAL_RECORD_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_SUPPRESSION", "CONSTITUTIONAL_FINDING_SUPPRESSION_DETECTED"],
    ["GOVERNANCE_SUPPRESSION", "GOVERNANCE_HISTORY_SUPPRESSION_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["WRITE_ACCESS", "DASHBOARD_WRITE_ACCESS_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_DASHBOARD_METRICS"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskAdaptationDashboardScenario, RiskAdaptationDashboardFailure][])("fails closed for %s", (scenario, failure) => {
    const result = generateRiskAdaptationDashboards({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.mutates_operational_data).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = generateRiskAdaptationDashboards({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_linkage_complete).toBe(false);
  });

  it("rejects mutation and unauthorized tenant visibility", () => {
    expect(generateRiskAdaptationDashboards({ scenario: "OPERATIONAL_MUTATION" }).validation.state).toBe("REJECTED");
    expect(generateRiskAdaptationDashboards({ scenario: "UNAUTHORIZED_TENANT" }).validation.state).toBe("REJECTED");
  });

  it("detects replay tampering", () => {
    const result = generateRiskAdaptationDashboards({ scenario: "OVERVIEW" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskAdaptationDashboards(tampered)).toBe(false);
  });
});
