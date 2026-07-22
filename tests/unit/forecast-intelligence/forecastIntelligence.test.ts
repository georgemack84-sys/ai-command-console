import { describe, expect, it } from "vitest";

import {
  getForecastIntelligenceContract,
  replayForecastIntelligence,
  runForecastIntelligence,
  validateForecastIntelligence,
} from "../../../services/forecast-intelligence";
import type { ForecastIntelligenceScenario } from "../../../types/forecast-intelligence";

describe("forecast intelligence", () => {
  it("generates deterministic certified forecasts", () => {
    const first = runForecastIntelligence();
    const second = runForecastIntelligence();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.ready_for_strategy_evaluation).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateForecastIntelligence(first).valid).toBe(true);
    expect(replayForecastIntelligence(first)).toBe(true);
  });

  it("publishes forecast doctrine", () => {
    const bundle = getForecastIntelligenceContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.immutable_model_binding_required).toBe(true);
    expect(bundle.doctrine.confidence_uncertainty_separation_required).toBe(true);
    expect(bundle.doctrine.calibration_history_immutable).toBe(true);
    expect(bundle.doctrine.failures_preserved).toBe(true);
  });

  it("binds forecasts to one strategy, one scenario, one cycle, and one immutable model version", () => {
    const result = runForecastIntelligence();

    expect(result.forecasts).toHaveLength(6);
    expect(result.forecasts.every((forecast) => forecast.strategy_ref && forecast.scenario_ref && forecast.recommendation_cycle_ref)).toBe(true);
    expect(result.model_binding.bindings.every((binding) => binding.valid && binding.immutable)).toBe(true);
    expect(result.model_registry.models.every((model) => model.immutable && model.certified && !model.revoked && !model.expired)).toBe(true);
  });

  it("validates inputs and separates confidence from uncertainty", () => {
    const result = runForecastIntelligence();

    expect(result.input_validation.rejected_forecast_ids).toHaveLength(0);
    expect(result.uncertainty.confidence_separated_from_uncertainty).toBe(true);
    expect(result.uncertainty.uncertainty_contributors).toContain("assumption sensitivity");
    expect(result.forecasts.every((forecast) => forecast.forecast_confidence !== forecast.forecast_uncertainty)).toBe(true);
  });

  it("preserves calibration, failures, replay, ledger, and registry integrity", () => {
    const result = runForecastIntelligence();

    expect(result.calibration.history_immutable).toBe(true);
    expect(result.replay.outcome).toBe("MATCH");
    expect(result.registry.complete).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.failure_records).toHaveLength(0);
  });

  it("runs the phase 12.6 certification suite", () => {
    const result = runForecastIntelligence();

    expect(result.certification.tests).toHaveLength(28);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for model, input, uncertainty, calibration, replay, governance, tenant, and ledger violations", () => {
    const scenarios: readonly ForecastIntelligenceScenario[] = [
      "MODEL_REGISTRY_INCOMPLETE",
      "MODEL_BINDING_MUTABLE",
      "UNKNOWN_MODEL",
      "EXPIRED_MODEL",
      "REVOKED_MODEL",
      "UNCERTIFIED_MODEL",
      "INPUT_VALIDATION_FAILED",
      "INCOMPLETE_STRATEGY",
      "UNQUALIFIED_SCENARIO",
      "UNSUPPORTED_VARIABLES",
      "EVIDENCE_MISSING",
      "INVALID_ASSUMPTIONS",
      "POLICY_MANIFEST_MISSING",
      "GOVERNANCE_APPROVAL_MISSING",
      "AUTHORITY_VIOLATION",
      "HIDDEN_UNCERTAINTY",
      "CONFIDENCE_UNCERTAINTY_MERGED",
      "CALIBRATION_HISTORY_MUTABLE",
      "FAILED_FORECAST_NOT_PRESERVED",
      "REPLAY_MISMATCH",
      "TENANT_ISOLATION_BREACH",
      "ADVISORY_BOUNDARY_VIOLATION",
      "LEDGER_NOT_APPEND_ONLY",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runForecastIntelligence({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.ready_for_strategy_evaluation).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateForecastIntelligence(result).valid).toBe(false);
    }
  });
});
