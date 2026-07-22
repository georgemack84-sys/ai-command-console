import { describe, expect, it } from "vitest";

import {
  getHistoricalReasoningContract,
  replayHistoricalReasoning,
  runHistoricalReasoning,
  validateHistoricalReasoning,
} from "../../../services/historical-reasoning-engine";

describe("historical reasoning engine", () => {
  it("runs deterministic certified historical reasoning", () => {
    const first = runHistoricalReasoning();
    const second = runHistoricalReasoning();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateHistoricalReasoning(first).valid).toBe(true);
    expect(replayHistoricalReasoning(first)).toBe(true);
  });

  it("preserves advisory-only and no-mutation boundaries", () => {
    const bundle = getHistoricalReasoningContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.mutation_supported).toBe(false);
    expect(bundle.doctrine.autonomous_learning_supported).toBe(false);
    expect(bundle.doctrine.counterfactuals_are_history).toBe(false);
    expect(bundle.result.contract.mutation_supported).toBe(false);
  });

  it("retrieves, compares, correlates, and reasons over certified graph intelligence", () => {
    const result = runHistoricalReasoning();

    expect(result.graph_certified).toBe(true);
    expect(result.retrieval.deterministic).toBe(true);
    expect(result.comparison.score).toBeGreaterThanOrEqual(0.8);
    expect(result.recommendation_history.deterministic).toBe(true);
    expect(result.outcome_correlation.deterministic).toBe(true);
    expect(result.strategy_evolution.deterministic).toBe(true);
    expect(result.temporal_reasoning.deterministic).toBe(true);
  });

  it("keeps counterfactual references separate from actual history", () => {
    const result = runHistoricalReasoning();

    expect(result.counterfactual_reference.separated_from_history).toBe(true);
    expect(result.counterfactual_reference.simulated_refs.every((ref) => ref.startsWith("simulation:"))).toBe(true);
    expect(result.counterfactual_reference.actual_history_refs.every((ref) => !ref.startsWith("simulation:"))).toBe(true);
  });

  it("generates explainable advisory recommendations with lineage", () => {
    const result = runHistoricalReasoning();

    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations.every((item) => item.advisory_only && item.auto_execute === false)).toBe(true);
    expect(result.recommendations.every((item) => item.lineage_refs.length > 0)).toBe(true);
    expect(result.record.generated_recommendations).toHaveLength(2);
  });

  it("runs the certification suite and append-only ledger", () => {
    const result = runHistoricalReasoning();

    expect(result.certification.tests).toHaveLength(31);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
    expect(result.ledger).toHaveLength(10);
    expect(result.ledger.every((entry, index) => entry.append_only && entry.sequence === index + 1)).toBe(true);
  });

  it("fails closed on historical contamination, governance, and replay violations", () => {
    for (const scenario of ["COUNTERFACTUAL_CONTAMINATION", "GOVERNANCE_VALIDATION_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING", "TENANT_ISOLATION_BREACH", "REPLAY_DIVERGENCE", "HISTORICAL_MUTATION_ATTEMPT"] as const) {
      const result = runHistoricalReasoning({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.production_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateHistoricalReasoning(result).valid).toBe(false);
    }
  });
});
