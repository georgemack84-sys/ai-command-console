import { describe, expect, it } from "vitest";

import {
  ConservativeCanonicalSemanticUnitClassifier,
  compareCanonicalClassifiers,
  evaluateCanonicalClassifier,
} from "@/services/learning-constitution";
import type { CanonicalSemanticUnitClassifier } from "@/types/learning-constitution";

const baseline = new ConservativeCanonicalSemanticUnitClassifier();
const disagreeingClassifier: CanonicalSemanticUnitClassifier = {
  classify(unit) {
    const result = baseline.classify(unit);
    return unit.semanticUnitId === "u1" && unit.content.startsWith("For example")
      ? { ...result, classifierId: "test-disagreeing-classifier", category: "RULE", status: "CLASSIFIED" as const }
      : { ...result, classifierId: "test-disagreeing-classifier" };
  },
};

describe("taxonomy evaluation", () => {
  it("reports risk-weighted perfect performance for the deterministic baseline", () => {
    const report = evaluateCanonicalClassifier(baseline);
    expect(report).toMatchObject({ weightedAccuracy: 1, failedRiskWeight: 0, criticalFailureCount: 0 });
    expect(report.totalRiskWeight).toBeGreaterThan(report.observations.length);
  });

  it("surfaces cross-classifier disagreements and identifies critical disagreement", () => {
    const report = compareCanonicalClassifiers([baseline, disagreeingClassifier]);
    expect(report.comparedUnitCount).toBeGreaterThan(0);
    expect(report.disagreementCount).toBeGreaterThan(0);
    expect(report.criticalDisagreementCount).toBeGreaterThan(0);
    expect(report.disagreements.some((disagreement) => disagreement.results[1].category === "RULE")).toBe(true);
  });

  it("requires at least two classifiers for consistency evaluation", () => {
    expect(() => compareCanonicalClassifiers([baseline])).toThrow();
  });
});
