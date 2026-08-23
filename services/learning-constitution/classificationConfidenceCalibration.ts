import calibrationPolicy from "../../learning/taxonomy/confidence-calibration.v1.json";
import {
  CANONICAL_INFORMATION_CATEGORIES,
  type CanonicalClassificationResult,
  type ClassificationConfidenceCalibrationPolicy,
  type ClassificationConfidenceCalibrationResult,
} from "../../types/learning-constitution";

export const validateClassificationConfidenceCalibrationPolicy = (
  value: unknown,
): ClassificationConfidenceCalibrationPolicy => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("confidence calibration policy is invalid");
  const policy = value as Record<string, unknown>;
  if (policy.policyVersion !== "1.0.0" || typeof policy.maximumAmbiguousConfidence !== "number" ||
    policy.maximumAmbiguousConfidence < 0 || policy.maximumAmbiguousConfidence > 1 ||
    typeof policy.minimumConfidenceByCategory !== "object" || policy.minimumConfidenceByCategory === null || Array.isArray(policy.minimumConfidenceByCategory)) {
    throw new Error("confidence calibration policy root is invalid");
  }
  const thresholds = policy.minimumConfidenceByCategory as Record<string, unknown>;
  if (Object.keys(thresholds).length !== CANONICAL_INFORMATION_CATEGORIES.length ||
    CANONICAL_INFORMATION_CATEGORIES.some((category) => typeof thresholds[category] !== "number" || thresholds[category] < 0 || thresholds[category] > 1)) {
    throw new Error("confidence calibration policy must define every canonical category exactly once");
  }
  return policy as ClassificationConfidenceCalibrationPolicy;
};

export const CANONICAL_CONFIDENCE_CALIBRATION_POLICY = validateClassificationConfidenceCalibrationPolicy(calibrationPolicy);

const requireReview = (
  result: CanonicalClassificationResult,
  reasonCode: "BELOW_CATEGORY_CONFIDENCE_THRESHOLD" | "AMBIGUITY_CONFIDENCE_EXCEEDS_POLICY",
): ClassificationConfidenceCalibrationResult => {
  const candidates = result.category ? [{ category: result.category, confidence: result.confidence }, ...result.candidates] : result.candidates;
  const { category: _category, ...withoutCategory } = result;
  return { result: { ...withoutCategory, status: "REQUIRES_REVIEW", candidates, reasonCodes: [...result.reasonCodes, reasonCode] }, calibrated: true, reasonCode };
};

export const calibrateCanonicalClassificationConfidence = (
  result: CanonicalClassificationResult,
  policy: ClassificationConfidenceCalibrationPolicy = CANONICAL_CONFIDENCE_CALIBRATION_POLICY,
): ClassificationConfidenceCalibrationResult => {
  if (result.status === "CLASSIFIED" && result.category && result.confidence < policy.minimumConfidenceByCategory[result.category]) {
    return requireReview(result, "BELOW_CATEGORY_CONFIDENCE_THRESHOLD");
  }
  if (result.status === "AMBIGUOUS" && result.confidence > policy.maximumAmbiguousConfidence) {
    return requireReview(result, "AMBIGUITY_CONFIDENCE_EXCEEDS_POLICY");
  }
  return { result, calibrated: false };
};
