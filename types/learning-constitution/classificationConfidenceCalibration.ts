import type { CanonicalClassificationResult } from "./canonicalClassification";
import type { CanonicalInformationCategory } from "./canonicalTaxonomy";

export type ClassificationConfidenceCalibrationPolicy = Readonly<{
  policyVersion: "1.0.0";
  minimumConfidenceByCategory: Readonly<Record<CanonicalInformationCategory, number>>;
  maximumAmbiguousConfidence: number;
}>;

export type ClassificationConfidenceCalibrationResult = Readonly<{
  result: CanonicalClassificationResult;
  calibrated: boolean;
  reasonCode?: "BELOW_CATEGORY_CONFIDENCE_THRESHOLD" | "AMBIGUITY_CONFIDENCE_EXCEEDS_POLICY";
}>;
