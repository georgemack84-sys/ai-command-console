import { describe, expect, it } from "vitest";
import { getRiskAdaptationSimulationFoundation, replayRiskAdaptationSimulation, runRiskAdaptationSimulation } from "@/services/risk-adaptation-simulation";
import type { RiskAdaptationSimulationFailure, RiskAdaptationSimulationScenario } from "@/types/risk-adaptation-simulation";

describe("Mission Control Phase 10.7.8 Risk Adaptation Simulation", () => {
  it("publishes the risk adaptation simulation foundation", () => {
    const foundation = getRiskAdaptationSimulationFoundation();

    expect(foundation.risk_adaptation_simulation_version).toBe("risk-adaptation-simulation/v1");
    expect(foundation.api_surface.run_simulation).toBe("POST /risk-adaptation-simulation/run");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("runs simulations deterministically", () => {
    const first = runRiskAdaptationSimulation({ scenario: "COMPOSITE" });
    const second = runRiskAdaptationSimulation({ scenario: "COMPOSITE" });

    expect(first.records[0].simulation_id).toBe(second.records[0].simulation_id);
    expect(first.records[0].improvement_metrics.prediction_accuracy).toBe(second.records[0].improvement_metrics.prediction_accuracy);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("covers simulation engine types", () => {
    expect(runRiskAdaptationSimulation({ scenario: "HISTORICAL_REPLAY" }).records[0].simulation_type).toBe("HISTORICAL_REPLAY");
    expect(runRiskAdaptationSimulation({ scenario: "PREDICTIVE_FORECAST" }).records[0].simulation_type).toBe("PREDICTIVE_FORECAST");
    expect(runRiskAdaptationSimulation({ scenario: "CALIBRATION_COMPARISON" }).records[0].simulation_type).toBe("CALIBRATION_COMPARISON");
    expect(runRiskAdaptationSimulation({ scenario: "SCENARIO_EVALUATION" }).records[0].simulation_type).toBe("SCENARIO_EVALUATION");
    expect(runRiskAdaptationSimulation({ scenario: "IMPROVEMENT_ANALYSIS" }).records[0].simulation_type).toBe("IMPROVEMENT_ANALYSIS");
    expect(runRiskAdaptationSimulation({ scenario: "ESCALATION_BEHAVIOR" }).records[0].simulation_type).toBe("ESCALATION_BEHAVIOR");
    expect(runRiskAdaptationSimulation({ scenario: "ROLLBACK_BEHAVIOR" }).records[0].simulation_type).toBe("ROLLBACK_BEHAVIOR");
    expect(runRiskAdaptationSimulation({ scenario: "GOVERNANCE_OUTCOME" }).records[0].simulation_type).toBe("GOVERNANCE_OUTCOME");
    expect(runRiskAdaptationSimulation({ scenario: "COMPOSITE" }).records[0].simulation_type).toBe("COMPOSITE_SIMULATION");
  });

  it("covers deterministic scenario categories", () => {
    expect(runRiskAdaptationSimulation({ scenario: "NORMAL" }).records[0].scenario_category).toBe("NORMAL_OPERATIONS");
    expect(runRiskAdaptationSimulation({ scenario: "ELEVATED" }).records[0].scenario_category).toBe("ELEVATED_OPERATIONAL_RISK");
    expect(runRiskAdaptationSimulation({ scenario: "CRITICAL" }).records[0].scenario_category).toBe("CRITICAL_INCIDENT");
    expect(runRiskAdaptationSimulation({ scenario: "GOVERNANCE" }).records[0].scenario_category).toBe("GOVERNANCE_ESCALATION");
    expect(runRiskAdaptationSimulation({ scenario: "CONSTITUTIONAL" }).records[0].scenario_category).toBe("CONSTITUTIONAL_REVIEW");
    expect(runRiskAdaptationSimulation({ scenario: "INFRASTRUCTURE" }).records[0].scenario_category).toBe("INFRASTRUCTURE_DISRUPTION");
    expect(runRiskAdaptationSimulation({ scenario: "RECOVERY" }).records[0].scenario_category).toBe("RECOVERY_OPERATIONS");
    expect(runRiskAdaptationSimulation({ scenario: "CROSS_TENANT_SCENARIO" }).records[0].scenario_category).toBe("CROSS_TENANT_ISOLATION");
  });

  it("measures objective simulation improvements", () => {
    const result = runRiskAdaptationSimulation({ scenario: "IMPROVEMENT_ANALYSIS" });
    const record = result.records[0];

    expect(record.proposed_results.prediction_accuracy).toBeGreaterThan(record.baseline_results.prediction_accuracy);
    expect(record.improvement_metrics.false_positive_reduction).toBeGreaterThan(0);
    expect(record.improvement_metrics.false_negative_reduction).toBeGreaterThan(0);
    expect(record.false_positive_rate).toBeLessThan(0.18);
    expect(record.false_negative_rate).toBeLessThan(0.22);
  });

  it("keeps simulations advisory and production-isolated", () => {
    const result = runRiskAdaptationSimulation({ scenario: "ESCALATION_BEHAVIOR" });
    const record = result.records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.production_isolated).toBe(true);
    expect(result.mutates_production_risk_models).toBe(false);
    expect(result.executes_recalibration).toBe(false);
    expect(result.changes_escalation_policies).toBe(false);
    expect(result.changes_rollback_policies).toBe(false);
    expect(record.overrides_operator_authority).toBe(false);
  });

  it("indexes simulations in an immutable ledger", () => {
    const result = runRiskAdaptationSimulation({ scenario: "ROLLBACK_BEHAVIOR" });
    const record = result.records[0];

    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.immutable).toBe(true);
    expect(result.ledger.deleted).toBe(false);
    expect(result.ledger.type_index.ROLLBACK_BEHAVIOR).toContain(record.simulation_id);
    expect(result.ledger.scenario_index.RECOVERY_OPERATIONS).toContain(record.simulation_id);
  });

  it("replays simulation output", () => {
    const result = runRiskAdaptationSimulation({ scenario: "COMPOSITE" });

    expect(replayRiskAdaptationSimulation(result)).toBe(true);
  });

  it.each([
    ["MISSING_PROPOSAL", "PROPOSAL_INPUTS_MISSING"],
    ["REPLAY_FAILED", "HISTORICAL_REPLAY_FAILED"],
    ["MISSING_DETERMINISM", "DETERMINISTIC_EXECUTION_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_IMPROVEMENT", "IMPROVEMENT_MEASUREMENTS_MISSING"],
    ["GOVERNANCE_REGRESSION", "GOVERNANCE_PRESERVATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_COMPLIANCE_FAILED"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["BROKEN_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["PRODUCTION_MUTATION", "PRODUCTION_RISK_MODEL_MUTATION_DETECTED"],
    ["RECALIBRATION_EXECUTION", "RECALIBRATION_EXECUTION_DETECTED"],
    ["ESCALATION_POLICY_MUTATION", "ESCALATION_POLICY_MUTATION_DETECTED"],
    ["ROLLBACK_POLICY_MUTATION", "ROLLBACK_POLICY_MUTATION_DETECTED"],
    ["GOVERNANCE_OVERRIDE", "GOVERNANCE_DECISION_OVERRIDE_DETECTED"],
    ["OPERATOR_OVERRIDE", "OPERATOR_AUTHORITY_OVERRIDE_DETECTED"],
    ["EVIDENCE_REWRITE", "HISTORICAL_EVIDENCE_REWRITE_DETECTED"],
    ["PRODUCTION_APPROVAL", "PRODUCTION_DEPLOYMENT_APPROVAL_DETECTED"],
    ["CERTIFICATION_MUTATION", "CERTIFICATION_STATUS_MUTATION_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_SIMULATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [RiskAdaptationSimulationScenario, RiskAdaptationSimulationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runRiskAdaptationSimulation({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.mutates_production_risk_models).toBe(false);
  });

  it("marks replay failures as pending replay", () => {
    const result = runRiskAdaptationSimulation({ scenario: "REPLAY_DIVERGENCE" });

    expect(result.validation.state).toBe("PENDING_REPLAY");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("rejects production mutation and recalibration execution", () => {
    expect(runRiskAdaptationSimulation({ scenario: "PRODUCTION_MUTATION" }).validation.state).toBe("REJECTED");
    expect(runRiskAdaptationSimulation({ scenario: "RECALIBRATION_EXECUTION" }).validation.state).toBe("REJECTED");
  });

  it("detects replay tampering", () => {
    const result = runRiskAdaptationSimulation({ scenario: "COMPOSITE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskAdaptationSimulation(tampered)).toBe(false);
  });
});
