import { describe, expect, it } from "vitest";

import {
  CANONICAL_TAXONOMY_V1_RELEASE,
  ConservativeCanonicalSemanticUnitClassifier,
  assertTaxonomyExitGate,
  canonicalTaxonomyV1ExitGateInput,
  evaluateCanonicalClassifier,
  evaluateTaxonomyExitGate,
  measureCanonicalClassifierPerformance,
  validateFrozenTaxonomyRelease,
} from "@/services/learning-constitution";

const evaluation = evaluateCanonicalClassifier(new ConservativeCanonicalSemanticUnitClassifier());
const performance = measureCanonicalClassifierPerformance(new ConservativeCanonicalSemanticUnitClassifier());

describe("canonical taxonomy v1 release readiness", () => {
  it("passes every exit check for the frozen v1 contract", () => {
    const report = assertTaxonomyExitGate(canonicalTaxonomyV1ExitGateInput(evaluation, performance));
    expect(report.passed).toBe(true);
    expect(report.checks.every((check) => check.passed)).toBe(true);
    expect(validateFrozenTaxonomyRelease(CANONICAL_TAXONOMY_V1_RELEASE, report)).toMatchObject({ status: "FROZEN", taxonomyVersion: "1.0.0" });
  });

  it("fails closed when reference, evaluation, or effect constraints regress", () => {
    const input = canonicalTaxonomyV1ExitGateInput(evaluation, performance);
    expect(evaluateTaxonomyExitGate({ ...input, renderedReference: "drift" }).passed).toBe(false);
    expect(() => assertTaxonomyExitGate({ ...input, evaluation: { ...evaluation, failedRiskWeight: 1, weightedAccuracy: 0.99 } })).toThrow();
    const effectBearing = { ...evaluation, observations: [{ ...evaluation.observations[0], actual: { ...evaluation.observations[0].actual, authorityEffect: "CHANGED" as "UNCHANGED" } }, ...evaluation.observations.slice(1)] };
    expect(() => assertTaxonomyExitGate({ ...input, evaluation: effectBearing })).toThrow();
  });

  it("does not validate a frozen release without a passing gate", () => {
    const failed = evaluateTaxonomyExitGate({ ...canonicalTaxonomyV1ExitGateInput(evaluation, performance), renderedReference: "drift" });
    expect(() => validateFrozenTaxonomyRelease(CANONICAL_TAXONOMY_V1_RELEASE, failed)).toThrow();
  });
});
