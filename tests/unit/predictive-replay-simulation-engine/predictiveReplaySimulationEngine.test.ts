import { describe, expect, it, vi } from "vitest";
import {
  buildPredictiveReplaySimulationObservabilitySurface,
  computePredictiveSimulationLedgerHash,
  getPredictiveReplaySimulationEngineContract,
  replayPredictiveReplaySimulation,
  runPredictiveReplaySimulation,
  validatePredictiveReplaySimulation,
} from "@/services/predictive-replay-simulation-engine";
import type { PredictiveReplaySimulationFailure, PredictiveReplaySimulationScenario } from "@/types/predictive-replay-simulation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.9 Predictive Replay & Simulation Engine", () => {
  it("defines the advisory-only predictive replay simulation doctrine", () => {
    const contract = getPredictiveReplaySimulationEngineContract();

    expect(contract.doctrine.engine_version).toBe("predictive-replay-simulation-engine/v8ALT.3.9");
    expect(contract.doctrine.principles).toContain("deterministic-replay");
    expect(contract.doctrine.principles).toContain("deterministic-simulation");
    expect(contract.doctrine.simulation_types).toContain("HISTORICAL_REPLAY");
    expect(contract.doctrine.simulation_types).toContain("CERTIFICATION_SIMULATION");
    expect(contract.validation.valid).toBe(true);
  });

  it("generates a complete simulation ledger across all simulation types", () => {
    const ledger = runPredictiveReplaySimulation();
    const validation = validatePredictiveReplaySimulation(ledger);

    expect(ledger.simulation_records.length).toBe(9);
    expect(ledger.simulation_records.every((item) => item.pipeline_state === "PUBLISHED")).toBe(true);
    expect(ledger.simulation_records.every((item) => item.replay_state === "CERTIFIED")).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("reproduces forecast replay, validation, future simulation, mitigation analysis, and accuracy deterministically", () => {
    const first = runPredictiveReplaySimulation();
    const second = runPredictiveReplaySimulation();

    expect(first.ledger_hash).toBe(second.ledger_hash);
    expect(first.replay_records).toEqual(second.replay_records);
    expect(first.validation_reports).toEqual(second.validation_reports);
    expect(first.mitigation_analyses).toEqual(second.mitigation_analyses);
    expect(first.prediction_accuracy_metrics).toEqual(second.prediction_accuracy_metrics);
  });

  it("reconstructs evidence, confidence, and recommendations", () => {
    const ledger = runPredictiveReplaySimulation();

    expect(ledger.simulation_records.every((item) => item.historical_replay.length > 0)).toBe(true);
    expect(ledger.simulation_records.every((item) => item.confidence_assessment.length > 0)).toBe(true);
    expect(ledger.simulation_records.every((item) => item.recommendations.length > 0)).toBe(true);
  });

  it("documents assumptions, limitations, explanations, governance, and constitutional validation", () => {
    const ledger = runPredictiveReplaySimulation();

    expect(ledger.simulation_records.every((item) => item.assumptions.length > 0)).toBe(true);
    expect(ledger.simulation_records.every((item) => item.limitations.length > 0)).toBe(true);
    expect(ledger.simulation_records.every((item) => item.explanation.length >= 5)).toBe(true);
    expect(ledger.simulation_records.every((item) => item.governance_validation === "PASS")).toBe(true);
    expect(ledger.simulation_records.every((item) => item.constitutional_validation === "PASS")).toBe(true);
  });

  it("preserves lineage, replay references, and integrity hashes", () => {
    const ledger = runPredictiveReplaySimulation();

    expect(ledger.lineage_references.length).toBe(9);
    expect(ledger.replay_references.length).toBe(9);
    expect(ledger.integrity_hashes.length).toBe(9);
  });

  it("replays and hashes predictive simulations deterministically", () => {
    const ledger = runPredictiveReplaySimulation();
    const replay = replayPredictiveReplaySimulation(ledger);

    expect(ledger.ledger_hash).toBe(computePredictiveSimulationLedgerHash(ledger));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(ledger.ledger_hash);
  });

  it("enforces advisory-only simulation behavior", () => {
    const ledger = runPredictiveReplaySimulation();
    const validation = validatePredictiveReplaySimulation(ledger);

    expect(ledger.simulation_records.every((item) => item.advisory_only)).toBe(true);
    expect(ledger.simulation_records.every((item) => !item.production_state_modified && !item.mitigation_executed && !item.governance_modified && !item.prediction_model_modified && !item.recovery_executed)).toBe(true);
    expect(validation.advisory_only_behavior_enforced).toBe(true);
  });

  it.each([
    ["PRODUCTION_STATE_MUTATION", "PRODUCTION_STATE_MUTATION_DETECTED"],
    ["AUTONOMOUS_MITIGATION_EXECUTION", "AUTONOMOUS_MITIGATION_EXECUTED"],
    ["GOVERNANCE_MODIFICATION_ATTEMPT", "AUTONOMOUS_GOVERNANCE_MODIFICATION_DETECTED"],
    ["MODEL_MODIFICATION_DURING_REPLAY", "PREDICTION_MODEL_MODIFICATION_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_DETECTED"],
  ] as readonly [PredictiveReplaySimulationScenario, PredictiveReplaySimulationFailure][])("fails closed for %s", (scenario, failure) => {
    const ledger = runPredictiveReplaySimulation({ scenario });
    const validation = validatePredictiveReplaySimulation(ledger);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible replay simulation diagnostics", () => {
    const surface = buildPredictiveReplaySimulationObservabilitySurface(runPredictiveReplaySimulation());

    expect(surface.simulation_count).toBe(9);
    expect(surface.replay_record_count).toBe(9);
    expect(surface.average_replay_consistency).toBeGreaterThan(0);
    expect(surface.average_forecast_accuracy).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
  });
});
