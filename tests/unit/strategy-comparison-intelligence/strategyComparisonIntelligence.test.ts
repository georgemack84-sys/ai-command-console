import { describe, expect, it } from "vitest";

import {
  getStrategyComparisonIntelligenceContract,
  replayStrategyComparisonIntelligence,
  runStrategyComparisonIntelligence,
  validateStrategyComparisonIntelligence,
} from "../../../services/strategy-comparison-intelligence";
import type { ComparisonScenario } from "../../../types/strategy-comparison-intelligence";

describe("strategy comparison intelligence", () => {
  it("creates deterministic certified comparisons", () => {
    const first = runStrategyComparisonIntelligence();
    const second = runStrategyComparisonIntelligence();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.ready_for_recommendation_engine).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateStrategyComparisonIntelligence(first).valid).toBe(true);
    expect(replayStrategyComparisonIntelligence(first)).toBe(true);
  });

  it("publishes comparison doctrine", () => {
    const bundle = getStrategyComparisonIntelligenceContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.immutable_thresholds_required).toBe(true);
    expect(bundle.doctrine.deterministic_tie_resolution_required).toBe(true);
    expect(bundle.doctrine.explainability_required).toBe(true);
    expect(bundle.doctrine.post_recommendation_mutation_blocked).toBe(true);
  });

  it("validates eligibility and evaluates registered dimensions", () => {
    const result = runStrategyComparisonIntelligence();

    expect(result.eligibility.rejected_strategy_refs).toHaveLength(0);
    expect(result.eligibility.deterministic).toBe(true);
    expect(result.dimensions.dimensions).toHaveLength(20);
    expect(result.dimensions.reproducible).toBe(true);
    expect(result.comparison.ranking).toHaveLength(result.comparison.participating_strategy_refs.length);
  });

  it("applies thresholds and deterministic tie resolution", () => {
    const result = runStrategyComparisonIntelligence();

    expect(result.thresholds.immutable).toBe(true);
    expect(result.thresholds.deterministic).toBe(true);
    expect(result.tie_resolution.resolved).toBe(true);
    expect(result.tie_resolution.deterministic).toBe(true);
    expect(result.comparison.lifecycle_state).toBe("COMPLETE");
  });

  it("preserves replay, explainability, supersession control, and ledgering", () => {
    const result = runStrategyComparisonIntelligence();

    expect(result.replay.outcome).toBe("MATCH");
    expect(result.explainability.complete).toBe(true);
    expect(result.supersession.post_recommendation_mutation_blocked).toBe(true);
    expect(result.registry.complete).toBe(true);
    expect(result.ledger.append_only).toBe(true);
  });

  it("runs the phase 12.7 certification suite", () => {
    const result = runStrategyComparisonIntelligence();

    expect(result.certification.tests).toHaveLength(25);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for eligibility, scoring, threshold, tie, supersession, replay, governance, and audit violations", () => {
    const scenarios: readonly ComparisonScenario[] = [
      "COMPARISON_IDENTITY_NONDETERMINISTIC",
      "ELIGIBILITY_VALIDATION_FAILED",
      "INCOMPLETE_STRATEGY",
      "POLICY_CONFLICT",
      "GOVERNANCE_FAILURE",
      "CONSTITUTIONAL_VIOLATION",
      "UNSUPPORTED_COMPARISON",
      "DIMENSION_REGISTRY_INCOMPLETE",
      "SCORING_NONDETERMINISTIC",
      "THRESHOLD_POLICY_MUTABLE",
      "THRESHOLD_EVALUATION_FAILED",
      "TIE_RESOLUTION_NONDETERMINISTIC",
      "UNRESOLVED_TIE",
      "COMPLETION_FAILED",
      "POST_RECOMMENDATION_MUTATION",
      "SUPERSESSION_LINEAGE_BROKEN",
      "REPLAY_MISMATCH",
      "EXPLAINABILITY_INCOMPLETE",
      "TENANT_ISOLATION_BREACH",
      "ADVISORY_BOUNDARY_VIOLATION",
      "LEDGER_NOT_APPEND_ONLY",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runStrategyComparisonIntelligence({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.ready_for_recommendation_engine).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateStrategyComparisonIntelligence(result).valid).toBe(false);
    }
  });
});
