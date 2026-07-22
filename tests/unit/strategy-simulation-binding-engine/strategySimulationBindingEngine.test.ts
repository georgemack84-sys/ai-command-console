import { describe, expect, it } from "vitest";
import { reviewGovernanceConstitutionalStrategy } from "@/services/governance-constitutional-strategy-review";
import { recordStrategyEvolutionLedger } from "@/services/strategy-evolution-ledger";
import { generateStrategyImprovementProposals } from "@/services/strategy-improvement-proposal-generator";
import {
  bindStrategySimulation,
  getStrategySimulationBindingFoundation,
  replayStrategySimulationBinding,
} from "@/services/strategy-simulation-binding-engine";
import type { StrategySimulationBindingFailure, StrategySimulationBindingScenario } from "@/types/strategy-simulation-binding-engine";

const proposal_result = generateStrategyImprovementProposals();
const ledger_result = recordStrategyEvolutionLedger({ proposal_result });
const review_result = reviewGovernanceConstitutionalStrategy({ ledger_result });

describe("Mission Control Phase 10.5.8 Strategy Simulation Binding Engine", () => {
  it("publishes the strategy simulation binding foundation", () => {
    const foundation = getStrategySimulationBindingFoundation();

    expect(foundation.strategy_simulation_binding_engine_version).toBe("strategy-simulation-binding-engine/v1");
    expect(foundation.api_surface.bind_simulation).toBe("POST /strategy-simulation-binding-engine/bind");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("binds strategy simulations deterministically", () => {
    const first = bindStrategySimulation({ review_result });
    const second = bindStrategySimulation({ review_result });

    expect(first.bindings[0].simulation_binding_id).toBe(second.bindings[0].simulation_binding_id);
    expect(first.bindings[0].simulation_readiness_status).toBe("READY_FOR_SIMULATION");
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports readiness statuses", () => {
    expect(bindStrategySimulation({ review_result, scenario: "READY" }).bindings[0].simulation_readiness_status).toBe("READY_FOR_SIMULATION");
    expect(bindStrategySimulation({ review_result, scenario: "REQUIRES_REVISION" }).bindings[0].simulation_readiness_status).toBe("REQUIRES_REVISION");
    expect(bindStrategySimulation({ review_result, scenario: "FAILED_VALIDATION" }).bindings[0].simulation_readiness_status).toBe("FAILED_VALIDATION");
  });

  it("binds scenarios, replay, counterfactual, stress, comparative, governance, risk, and rollback references", () => {
    const binding = bindStrategySimulation({ review_result }).bindings[0];

    expect(binding.simulation_scenarios.length).toBeGreaterThan(0);
    expect(binding.historical_replay_refs.length).toBeGreaterThan(0);
    expect(binding.counterfactual_refs.length).toBeGreaterThan(0);
    expect(binding.stress_test_refs.length).toBeGreaterThan(0);
    expect(binding.comparative_baseline_refs.length).toBeGreaterThan(0);
    expect(binding.governance_validation_refs.length).toBeGreaterThan(0);
    expect(binding.expected_benefits.length).toBeGreaterThan(0);
    expect(binding.expected_risks.length).toBeGreaterThan(0);
    expect(binding.unintended_consequence_summary.length).toBeGreaterThan(0);
    expect(binding.replay_refs.length).toBeGreaterThan(0);
    expect(binding.rollback_refs.length).toBeGreaterThan(0);
  });

  it("keeps simulation binding advisory and does not authorize adoption or execution", () => {
    const result = bindStrategySimulation({ review_result });
    const binding = result.bindings[0];

    expect(result.simulation_mandatory).toBe(true);
    expect(result.authorizes_adoption).toBe(false);
    expect(result.mutates_strategy).toBe(false);
    expect(binding.simulation_execution_authorized).toBe(false);
    expect(binding.advisory_only).toBe(true);
    expect(binding.mutates_strategy).toBe(false);
  });

  it("records immutable append-only simulation registry entries", () => {
    const result = bindStrategySimulation({ review_result });
    const binding = result.bindings[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.simulation_binding_refs).toEqual([binding.simulation_binding_id]);
    expect(result.registry.readiness_index[binding.simulation_readiness_status]).toEqual([binding.simulation_binding_id]);
  });

  it("replays strategy simulation binding", () => {
    const result = bindStrategySimulation({ review_result });

    expect(replayStrategySimulationBinding(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_REVIEW", "GOVERNANCE_REVIEW_UNCERTIFIED"],
    ["MISSING_SCENARIO", "SIMULATION_SCENARIO_NOT_ASSIGNED"],
    ["MISSING_HISTORICAL_REPLAY", "HISTORICAL_REPLAY_UNAVAILABLE"],
    ["MISSING_COUNTERFACTUAL", "COUNTERFACTUAL_ANALYSIS_OMITTED"],
    ["MISSING_STRESS", "STRESS_TESTING_OMITTED"],
    ["MISSING_COMPARATIVE", "COMPARATIVE_ANALYSIS_INCOMPLETE"],
    ["MISSING_BENEFITS", "EXPECTED_BENEFITS_NOT_MEASURED"],
    ["MISSING_RISKS", "EXPECTED_RISKS_NOT_EVALUATED"],
    ["MISSING_CONSEQUENCES", "UNINTENDED_CONSEQUENCES_NOT_ANALYZED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_VALIDATION_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_ROLLBACK", "ROLLBACK_REFERENCES_MISSING"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["SIMULATION_BYPASS", "SIMULATION_BYPASS_DETECTED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategySimulationBindingScenario, StrategySimulationBindingFailure][])("fails closed for %s", (scenario, failure) => {
    const result = bindStrategySimulation({ review_result, scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.simulation_ready).toBe(false);
    expect(result.authorizes_adoption).toBe(false);
  });

  it("keeps incomplete simulation inputs pending instead of certified", () => {
    const result = bindStrategySimulation({ review_result, scenario: "MISSING_COUNTERFACTUAL" });

    expect(result.validation.state).toBe("PENDING_SIMULATION_INPUTS");
    expect(result.validation.counterfactual_complete).toBe(false);
  });

  it("detects simulation binding tampering during replay", () => {
    const result = bindStrategySimulation({ review_result });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategySimulationBinding(tampered)).toBe(false);
  });
});
