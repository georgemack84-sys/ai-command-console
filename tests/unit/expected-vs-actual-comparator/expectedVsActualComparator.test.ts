import { describe, expect, it } from "vitest";
import {
  compareExpectedVsActual,
  COMPARISON_DOMAINS,
  computeOutcomeVarianceHash,
  getExpectedVsActualComparatorFoundation,
  replayExpectedVsActual,
} from "@/services/expected-vs-actual-comparator";
import type { ComparatorFailure, ComparatorScenario } from "@/types/expected-vs-actual-comparator";

describe("Mission Control Phase 10.3.2 Expected vs Actual Comparator", () => {
  it("publishes the expected vs actual comparator foundation", () => {
    const foundation = getExpectedVsActualComparatorFoundation();

    expect(foundation.expected_vs_actual_comparator_version).toBe("expected-vs-actual-comparator/v1");
    expect(foundation.comparison_domains).toEqual(COMPARISON_DOMAINS);
    expect(foundation.api_surface.compare_outcomes).toBe("POST /expected-vs-actual-comparator/compare");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("compares prediction accuracy without mutating recommendations or outcomes", () => {
    const result = compareExpectedVsActual();

    expect(result.compares_prediction_accuracy_only).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.modifies_outcomes).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.api_surface.update_supported).toBe(false);
    expect(result.api_surface.delete_supported).toBe(false);
    expect(result.api_surface.adaptive_learning_supported).toBe(false);
  });

  it("compares all required domains with evidence-backed explanations", () => {
    const result = compareExpectedVsActual();

    expect(result.variances.map((variance) => variance.comparison_domain)).toEqual(COMPARISON_DOMAINS);
    expect(result.expected_values).toHaveLength(COMPARISON_DOMAINS.length);
    expect(result.actual_values).toHaveLength(COMPARISON_DOMAINS.length);
    expect(result.variances.every((variance) => variance.explanation.length > 0)).toBe(true);
    expect(result.variances.every((variance) => variance.supporting_evidence_refs.length > 0)).toBe(true);
  });

  it("creates stable variance hashes and replay output", () => {
    const result = compareExpectedVsActual();

    expect(result.variances.every((variance) => computeOutcomeVarianceHash(variance) === variance.integrity_hash)).toBe(true);
    expect(replayExpectedVsActual(result)).toBe(true);
  });

  it.each([
    ["BASELINE", "PERFECT_ALIGNMENT", "NONE"],
    ["MINOR_VARIANCE", "MINOR_VARIANCE", "LOW"],
    ["MODERATE_VARIANCE", "MODERATE_VARIANCE", "MODERATE"],
    ["MAJOR_VARIANCE", "MAJOR_VARIANCE", "HIGH"],
    ["CRITICAL_VARIANCE", "CRITICAL_VARIANCE", "CRITICAL"],
  ] as const)("classifies %s deterministically", (scenario, category, severity) => {
    const result = compareExpectedVsActual({ scenario });

    expect(result.variances.some((variance) => variance.category === category)).toBe(true);
    expect(result.variances.some((variance) => variance.severity === severity)).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it("records immutable ledger references for every variance", () => {
    const result = compareExpectedVsActual();

    expect(result.ledger_record.append_only).toBe(true);
    expect(result.ledger_record.deleted).toBe(false);
    expect(result.ledger_record.variance_refs).toEqual(result.variances.map((variance) => variance.variance_id));
    expect(result.validation.ledger_recorded).toBe(true);
  });

  it("validates governance, replay, tenant isolation, evidence, and explanations", () => {
    const result = compareExpectedVsActual();

    expect(result.validation.governance_validated).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.explanations_complete).toBe(true);
    expect(result.validation.replay_reconstruction_identical).toBe(true);
  });

  it.each([
    ["MISSING_EXPECTED", "EXPECTED_VALUES_MISSING"],
    ["MISSING_OBSERVED", "OBSERVED_VALUES_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_ABSENT"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["HASH_MISMATCH", "INTEGRITY_MISMATCH_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["RECONSTRUCTION_FAILURE", "RECOMMENDATION_RECONSTRUCTION_FAILED"],
    ["OUTCOME_UNAVAILABLE", "OBSERVED_OUTCOME_UNAVAILABLE"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
    ["UNEXPLAINED_VARIANCE", "UNEXPLAINED_VARIANCE"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [ComparatorScenario, ComparatorFailure][])("fails closed for %s", (scenario, failure) => {
    const result = compareExpectedVsActual({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.modifies_outcomes).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
  });

  it("keeps missing observed or evidence comparisons pending instead of certified", () => {
    expect(compareExpectedVsActual({ scenario: "MISSING_OBSERVED" }).validation.state).toBe("PENDING_EVIDENCE");
    expect(compareExpectedVsActual({ scenario: "INCOMPLETE_EVIDENCE" }).validation.state).toBe("PENDING_EVIDENCE");
  });

  it("detects comparator tampering during replay", () => {
    const result = compareExpectedVsActual();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayExpectedVsActual(tampered)).toBe(false);
  });
});
