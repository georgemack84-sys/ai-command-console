import { describe, expect, it } from "vitest";

import {
  CANONICAL_CONFIDENCE_CALIBRATION_POLICY,
  ConservativeCanonicalSemanticUnitClassifier,
  calibrateCanonicalClassificationConfidence,
  validateClassificationConfidenceCalibrationPolicy,
} from "@/services/learning-constitution";
import type { CanonicalClassificationResult, SemanticUnit } from "@/types/learning-constitution";

const unit: SemanticUnit = { semanticUnitId: "unit-1", source: { observationId: "observation-1", sourceId: "source-1", sourceType: "DOCUMENT", originatingActorId: "test", observedAt: "2026-08-21T00:00:00.000Z" }, sourceOrder: 0, textSpan: { start: 0, end: 23 }, content: "Write the tests first.", containment: "ROOT" };
const baseline = new ConservativeCanonicalSemanticUnitClassifier().classify(unit);

describe("classification confidence calibration", () => {
  it("loads a complete bounded policy and retains classifications above threshold", () => {
    expect(CANONICAL_CONFIDENCE_CALIBRATION_POLICY.minimumConfidenceByCategory.RULE).toBe(0.9);
    expect(calibrateCanonicalClassificationConfidence(baseline)).toEqual({ result: baseline, calibrated: false });
  });

  it("downgrades under-threshold classification to review while retaining evidence as a candidate", () => {
    const lowConfidence = { ...baseline, confidence: 0.2 } as CanonicalClassificationResult;
    const calibrated = calibrateCanonicalClassificationConfidence(lowConfidence);
    expect(calibrated).toMatchObject({ calibrated: true, reasonCode: "BELOW_CATEGORY_CONFIDENCE_THRESHOLD", result: { status: "REQUIRES_REVIEW", candidates: [{ category: "INSTRUCTION", confidence: 0.2 }], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false } });
    expect(calibrated.result).not.toHaveProperty("category");
  });

  it("rejects incomplete policies and does not turn ambiguity into a category", () => {
    expect(() => validateClassificationConfidenceCalibrationPolicy({ ...CANONICAL_CONFIDENCE_CALIBRATION_POLICY, minimumConfidenceByCategory: {} })).toThrow();
    const ambiguous = { ...baseline, status: "AMBIGUOUS" as const, category: undefined, confidence: 0.9, candidates: [{ category: "SUGGESTION" as const, confidence: 0.9 }] };
    const calibrated = calibrateCanonicalClassificationConfidence(ambiguous);
    expect(calibrated).toMatchObject({ calibrated: true, result: { status: "REQUIRES_REVIEW" } });
    expect(calibrated.result).not.toHaveProperty("category");
  });
});
