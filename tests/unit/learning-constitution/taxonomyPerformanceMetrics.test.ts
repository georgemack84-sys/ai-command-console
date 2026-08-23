import { describe, expect, it } from "vitest";

import {
  ConservativeCanonicalSemanticUnitClassifier,
  measureCanonicalClassifierPerformance,
} from "@/services/learning-constitution";
import type { CanonicalSemanticUnitClassifier } from "@/types/learning-constitution";

const baseline = new ConservativeCanonicalSemanticUnitClassifier();
const confusedClassifier: CanonicalSemanticUnitClassifier = {
  classify(unit) {
    const result = baseline.classify(unit);
    return result.category === "IDEA" ? { ...result, classifierId: "confused-classifier", category: "DECISION" } : { ...result, classifierId: "confused-classifier" };
  },
};

describe("taxonomy classifier performance metrics", () => {
  it("reports a diagonal confusion matrix and risk-weighted success for the baseline", () => {
    const report = measureCanonicalClassifierPerformance(baseline);
    expect(report).toMatchObject({ categoryAccuracy: 1, statusMismatches: [], evaluation: { weightedAccuracy: 1, criticalFailureCount: 0 } });
    expect(report.confusionMatrix.every((entry) => entry.expectedCategory === entry.observedCategory)).toBe(true);
  });

  it("makes category confusion and its weighted impact explicit", () => {
    const report = measureCanonicalClassifierPerformance(confusedClassifier);
    expect(report.categoryAccuracy).toBeLessThan(1);
    expect(report.confusionMatrix).toEqual(expect.arrayContaining([
      expect.objectContaining({ expectedCategory: "IDEA", observedCategory: "DECISION", count: expect.any(Number) }),
    ]));
    expect(report.evaluation.failedRiskWeight).toBeGreaterThan(0);
  });
});
