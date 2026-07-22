import { describe, expect, it } from "vitest";
import {
  getCounterfactualAdaptationSimulatorFoundation,
  replayCounterfactualSimulation,
  simulateCounterfactualAdaptation,
} from "@/services/counterfactual-adaptation-simulator";
import type {
  CounterfactualMeasurementDimension,
  CounterfactualSimulationFailure,
  CounterfactualSimulationScenario,
  CounterfactualSimulationScope,
} from "@/types/counterfactual-adaptation-simulator";

describe("Mission Control Phase 10.11.3 Counterfactual Adaptation Simulator", () => {
  const expectedScopes: readonly CounterfactualSimulationScope[] = [
    "ALTERNATE_RECOMMENDATION_PATHS",
    "ALTERNATE_CONFIDENCE_SCORES",
    "ALTERNATE_RISK_ASSESSMENTS",
    "ALTERNATE_PRIORITIZATION",
    "ALTERNATE_GOVERNANCE_ROUTING",
    "ALTERNATE_ESCALATION_BEHAVIOR",
  ];

  const expectedDimensions: readonly CounterfactualMeasurementDimension[] = [
    "IMPROVEMENT",
    "DEGRADATION",
    "UNINTENDED_CONSEQUENCES",
    "MISSED_OPPORTUNITIES",
    "INCREASED_RISK",
    "GOVERNANCE_VIOLATIONS",
    "OPERATOR_IMPACT",
  ];

  it("publishes the counterfactual simulator contract", () => {
    const foundation = getCounterfactualAdaptationSimulatorFoundation();

    expect(foundation.counterfactual_adaptation_simulator_version).toBe("counterfactual-adaptation-simulator/v1");
    expect(foundation.supported_scopes).toEqual(expectedScopes);
    expect(foundation.measurement_dimensions).toEqual(expectedDimensions);
    expect(foundation.api_surface.simulate_counterfactual).toBe("POST /counterfactual-adaptation-simulator/simulate");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /counterfactual-adaptation-simulator/contract");
    expect(foundation.api_surface.historical_truth_mutation_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.api_surface.autonomous_optimization_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.simulator_identifier).toBe("CounterfactualAdaptationSimulator");
    expect(foundation.result.outcome).toBe("PASS");
  });

  it("simulates deterministically with stable replay and integrity hashes", () => {
    const first = simulateCounterfactualAdaptation();
    const second = simulateCounterfactualAdaptation();

    expect(first.simulation_record.integrity_hash).toBe(second.simulation_record.integrity_hash);
    expect(first.measurements.map((measurement) => measurement.integrity_hash)).toEqual(second.measurements.map((measurement) => measurement.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.counterfactual_replay_package_hash).toBe(second.counterfactual_replay_package_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayCounterfactualSimulation(first)).toBe(true);
  });

  it("applies only the approved adaptation as the single changed variable", () => {
    const result = simulateCounterfactualAdaptation();

    expect(result.single_variable_preserved).toBe(true);
    expect(result.metrics.adaptation_single_variable_preserved).toBe(true);
    expect(result.immutable_history_preserved).toBe(true);
    expect(result.isolated_simulation_environment).toBe(true);
    expect(result.modifies_historical_truth).toBe(false);
    expect(result.modifies_production_state).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(result.historical_replay.outcome).toBe("PASS");
  });

  it("generates the required counterfactual simulation record", () => {
    const record = simulateCounterfactualAdaptation().simulation_record;

    expect(record.simulation_id).toMatch(/^counterfactual_simulation_/);
    expect(record.simulation_scope).toEqual(expectedScopes);
    expect(record.alternate_recommendations).toContain("recommendation_ordering");
    expect(record.alternate_confidence).toContain("revised_calibration");
    expect(record.alternate_risk).toContain("revised_escalation_thresholds");
    expect(record.alternate_prioritization).toContain("revised_dependency_ordering");
    expect(record.alternate_governance).toContain("revised_approval_paths");
    expect(record.alternate_escalation).toContain("revised_escalation_recipients");
    expect(record.replay_reproducible).toBe(true);
    expect(record.simulation_result).toBe("PASS");
  });

  it("measures improvement, degradation, side effects, risk, governance, and operator impact", () => {
    const result = simulateCounterfactualAdaptation();

    expect(result.measurements.map((measurement) => measurement.dimension)).toEqual(expectedDimensions);
    expect(result.simulation_record.improvement_metrics.measures).toContain("recommendation_quality");
    expect(result.simulation_record.degradation_metrics.measures).toContain("confidence_deterioration");
    expect(result.simulation_record.unintended_consequences.measures).toContain("cascading_effects");
    expect(result.simulation_record.missed_opportunities.measures).toContain("unrealized_improvements");
    expect(result.measurements.find((measurement) => measurement.dimension === "INCREASED_RISK")?.measures).toContain("greater_escalation_frequency");
    expect(result.simulation_record.governance_impact.measures).toContain("approval_bypasses");
    expect(result.simulation_record.operator_impact.measures).toContain("operator_trust");
  });

  it("publishes baseline simulation metrics and immutable evidence hashes", () => {
    const result = simulateCounterfactualAdaptation();

    expect(result.metrics.simulation_scopes_evaluated).toBe(6);
    expect(result.metrics.measurement_dimensions_evaluated).toBe(7);
    expect(result.metrics.deterministic_replay_rate).toBe(1);
    expect(result.metrics.improvement_score).toBeGreaterThan(0);
    expect(result.metrics.governance_preservation_rate).toBe(1);
    expect(result.metrics.operator_preservation_rate).toBe(1);
    expect(result.metrics.explanation_completeness_rate).toBe(1);
    expect(result.counterfactual_replay_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.improvement_analysis_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.side_effect_analysis_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.governance_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.operator_impact_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.simulation_validation_ledger_entry_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("preserves governance, constitutional safeguards, tenant isolation, operator authority, and advisory-only boundaries", () => {
    const result = simulateCounterfactualAdaptation();

    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_behavior_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.explainable).toBe(true);
  });

  it("supports conditional and inconclusive outcomes without granting implementation authority", () => {
    const conditional = simulateCounterfactualAdaptation({ scenario: "CONDITIONAL_EVIDENCE" });
    const inconclusive = simulateCounterfactualAdaptation({ scenario: "INCONCLUSIVE" });

    expect(conditional.outcome).toBe("CONDITIONAL_PASS");
    expect(conditional.authorizes_implementation).toBe(false);
    expect(inconclusive.outcome).toBe("INCONCLUSIVE");
    expect(inconclusive.authorizes_implementation).toBe(false);
    expect(replayCounterfactualSimulation(conditional)).toBe(true);
    expect(replayCounterfactualSimulation(inconclusive)).toBe(true);
  });

  it.each([
    ["NONDETERMINISTIC", "NONDETERMINISTIC_SIMULATION", "FAIL"],
    ["INCONSISTENT_REPLAY", "INCONSISTENT_REPLAY", "FAIL"],
    ["UNEXPLAINED_CHANGE", "UNEXPLAINED_BEHAVIORAL_CHANGES", "FAIL"],
    ["RECOMMENDATION_INSTABILITY", "RECOMMENDATION_INSTABILITY", "FAIL"],
    ["CONFIDENCE_INSTABILITY", "CONFIDENCE_INSTABILITY", "FAIL"],
    ["RISK_INSTABILITY", "RISK_INSTABILITY", "FAIL"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["OPERATOR_AUTHORITY_REDUCTION", "OPERATOR_AUTHORITY_REDUCTION", "REQUIRES_OPERATOR_REVIEW"],
    ["APPROVAL_WORKFLOW_BYPASS", "APPROVAL_WORKFLOW_BYPASS", "REQUIRES_OPERATOR_REVIEW"],
    ["UNAUTHORIZED_ESCALATION", "UNAUTHORIZED_ESCALATION", "REQUIRES_OPERATOR_REVIEW"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH", "FAIL"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE", "REQUIRES_MORE_EVIDENCE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILURE", "FAIL"],
    ["SIMULATION_STATE_CORRUPTION", "SIMULATION_STATE_CORRUPTION", "FAIL"],
    ["MULTIPLE_VARIABLES_CHANGED", "MULTIPLE_VARIABLES_CHANGED", "FAIL"],
    ["HISTORICAL_TRUTH_MUTATION", "HISTORICAL_TRUTH_MUTATION_ATTEMPT", "FAIL"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_ATTEMPT", "FAIL"],
    ["IMPLEMENTATION_AUTHORIZATION", "IMPLEMENTATION_AUTHORIZATION_ATTEMPT", "FAIL"],
  ] as const)("fails counterfactual simulation for %s", (scenario: CounterfactualSimulationScenario, failure: CounterfactualSimulationFailure, outcome) => {
    const result = simulateCounterfactualAdaptation({ scenario });

    expect(result.outcome).toBe(outcome);
    expect(result.failures).toContain(failure);
    expect(result.replayable).toBe(false);
    expect(replayCounterfactualSimulation(result)).toBe(true);
  });

  it("detects nested replay tampering", () => {
    const result = simulateCounterfactualAdaptation();
    const tampered = {
      ...result,
      simulation_record: {
        ...result.simulation_record,
        replay_reproducible: false,
      },
    };

    expect(replayCounterfactualSimulation(tampered)).toBe(false);
  });
});
