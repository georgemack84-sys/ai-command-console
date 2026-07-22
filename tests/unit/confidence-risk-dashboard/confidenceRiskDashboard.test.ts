import { describe, expect, it } from "vitest";
import {
  buildConfidenceRiskDashboard,
  getConfidenceRiskDashboardContract,
  replayConfidenceRiskDashboard,
  validateConfidenceRiskDashboard,
} from "@/services/confidence-risk-dashboard";
import type { ConfidenceRiskDashboardFailure, ConfidenceRiskDashboardScenario, ConfidenceRiskWidget } from "@/types/confidence-risk-dashboard";

describe("Mission Control Phase 10.14.6 Confidence & Risk Dashboard", () => {
  const widgets: readonly ConfidenceRiskWidget[] = [
    "Confidence Trend",
    "Calibration Timeline",
    "Risk Trend",
    "Severity Distribution",
    "Probability Distribution",
    "Historical Comparison",
    "Evidence Reliability",
    "Proposal Status",
    "Replay Explorer",
    "Alert Center",
  ];

  it("publishes the confidence risk dashboard contract", () => {
    const contract = getConfidenceRiskDashboardContract();

    expect(contract.doctrine.version).toBe("confidence-risk-dashboard/v10.14.6");
    expect(contract.doctrine.widgets).toEqual(widgets);
    expect(contract.doctrine.domains).toContain("CONFIDENCE_CALIBRATION");
    expect(contract.doctrine.domains).toContain("GOVERNANCE_SENSITIVE_RISK");
    expect(contract.doctrine.navigation_dimensions).toContain("confidence category");
    expect(contract.doctrine.navigation_dimensions).toContain("risk category");
    expect(contract.doctrine.required_data_sources).toContain("Confidence Adaptation Engine");
    expect(contract.doctrine.required_data_sources).toContain("Risk Adaptation Engine");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("renders deterministic confidence and risk intelligence", () => {
    const first = buildConfidenceRiskDashboard();
    const second = buildConfidenceRiskDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.widgets).toEqual(widgets);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.records.map((record) => record.integrity_hash)).toEqual(second.records.map((record) => record.integrity_hash));
    expect(validateConfidenceRiskDashboard(first).valid).toBe(true);
    expect(replayConfidenceRiskDashboard(first)).toBe(true);
  });

  it("represents all required confidence and risk dashboard sections", () => {
    const result = buildConfidenceRiskDashboard();

    expect(result.records).toHaveLength(2);
    expect(result.records.map((record) => record.intelligence_domain)).toContain("CONFIDENCE_CALIBRATION");
    expect(result.records.map((record) => record.intelligence_domain)).toContain("RISK_ADAPTATION");
    expect(result.calibration_view.calibration_status).toBe("well calibrated");
    expect(result.trend_view.distinguishes_raw_normalized_calibrated).toBe(true);
    expect(result.timeline.preserves_event_ordering).toBe(true);
    expect(result.drift_view.status).toBe("UNDER_REVIEW");
    expect(result.evidence_view.reliability_state).toBe("VERIFIED");
    expect(result.confidence_proposal_view.rollback_readiness).toBe("READY");
    expect(result.risk_adaptation_view.governance_sensitivity).toBe("POLICY_CONFLICT");
    expect(result.severity_view.canonical_taxonomy).toContain("CATASTROPHIC");
    expect(result.probability_view.unsupported_precision_displayed).toBe(false);
    expect(result.actualization_explorer.outcome).toBe("LESS_SEVERE_THAN_PREDICTED");
    expect(result.governance_risk_view.hidden_by_aggregation).toBe(false);
    expect(result.comparison_workspace.unsupported_composite_score).toBe(false);
    expect(result.proposal_status_panel.confidence_proposals.length).toBeGreaterThan(0);
    expect(result.replay_explorer.output_hash_verified).toBe(true);
    expect(result.alert_center.critical_conditions_visible).toBe(true);
  });

  it("links confidence and risk records to evidence, outcomes, governance, simulation, certification, replay, and rollback", () => {
    const result = buildConfidenceRiskDashboard();

    expect(result.records.every((record) => record.outcome_record_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.evidence_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.governance_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.simulation_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.operator_decision_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.certification_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.replay_refs.length > 0)).toBe(true);
    expect(result.records.every((record) => record.rollback_refs.length > 0)).toBe(true);
  });

  it("enforces role visibility, tenant isolation, restricted fields, and read-only behavior", () => {
    const result = buildConfidenceRiskDashboard();

    expect(result.permissions.every((permission) => permission.allowed)).toBe(true);
    expect(result.permissions.every((permission) => permission.tenant_isolated)).toBe(true);
    expect(result.permissions.every((permission) => permission.restricted_fields.length > 0)).toBe(true);
    expect(result.permissions.every((permission) => permission.evidence_authorized && permission.governance_authorized && permission.replay_authorized && permission.certification_authorized)).toBe(true);
    expect(result.api_surface.confidence_recalibration_supported).toBe(false);
    expect(result.api_surface.risk_model_mutation_supported).toBe(false);
    expect(result.api_surface.threshold_mutation_supported).toBe(false);
    expect(result.api_surface.proposal_approval_supported).toBe(false);
    expect(result.api_surface.simulation_bypass_supported).toBe(false);
    expect(result.api_surface.rollback_execution_supported).toBe(false);
    expect(result.api_surface.authority_expansion_supported).toBe(false);
    expect(result.read_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.write_authority_granted).toBe(false);
  });

  it("records observability and validation coverage", () => {
    const result = buildConfidenceRiskDashboard();

    expect(result.validation_tests).toHaveLength(21);
    expect(result.validation_tests.every((test) => test.passed)).toBe(true);
    expect(result.metrics.dashboard_rendering_latency_ms).toBe(12);
    expect(result.metrics.missing_outcome_links).toBe(0);
    expect(result.metrics.missing_evidence_references).toBe(0);
    expect(result.metrics.broken_replay_links).toBe(0);
    expect(result.metrics.hidden_state_discrepancies).toBe(0);
  });

  it.each([
    ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
    ["CONFIDENCE_HIDDEN", "CONFIDENCE_RECORD_HIDDEN"],
    ["RISK_HIDDEN", "RISK_RECORD_HIDDEN"],
    ["NONDETERMINISTIC_RENDERING", "DASHBOARD_RENDERING_NONDETERMINISTIC"],
    ["MISSING_OUTCOME", "OUTCOME_LINK_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_BROKEN"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_LINEAGE_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_STATUS_MISSING"],
    ["MISSING_OPERATOR_DECISION", "OPERATOR_DECISION_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_STATUS_MISSING"],
    ["MISSING_REPLAY", "REPLAY_READINESS_MISSING"],
    ["MISSING_ROLLBACK", "ROLLBACK_READINESS_MISSING"],
    ["UNSUPPORTED_CONFIDENCE", "UNSUPPORTED_CONFIDENCE_CLAIM"],
    ["UNSUPPORTED_RISK", "UNSUPPORTED_RISK_CLAIM"],
    ["GOVERNANCE_RISK_HIDDEN", "GOVERNANCE_SENSITIVE_RISK_HIDDEN"],
    ["DOMAIN_COLLAPSED", "CONFIDENCE_RISK_DOMAIN_COLLAPSED"],
    ["UNAUTHORIZED_ROLE", "UNAUTHORIZED_DASHBOARD_ACCESS"],
    ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
    ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["WRITE_AUTHORITY_EXPOSED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED"],
  ] as const)("fails closed for %s", (scenario: ConfidenceRiskDashboardScenario, failure: ConfidenceRiskDashboardFailure) => {
    const result = buildConfidenceRiskDashboard({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validateConfidenceRiskDashboard(result).valid).toBe(false);
    expect(replayConfidenceRiskDashboard(result)).toBe(false);
  });

  it("detects nested confidence risk record tampering", () => {
    const result = buildConfidenceRiskDashboard();
    const tampered = {
      ...result,
      records: [
        {
          ...result.records[0],
          tenant_id: "tenant-cross-boundary",
        },
        result.records[1],
      ],
    };

    expect(validateConfidenceRiskDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayConfidenceRiskDashboard(tampered)).toBe(false);
  });
});
