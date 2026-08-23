import type {
  CanonicalInputClassificationResult,
  CanonicalSemanticUnitClassifier,
  SemanticSegmentationRequest,
  SemanticUnitSegmenter,
} from "../../types/learning-constitution";
import { ConservativeCanonicalSemanticUnitClassifier } from "./conservativeCanonicalClassifier";
import { ConservativeSemanticUnitSegmenter } from "./conservativeSemanticSegmenter";
import { calibrateCanonicalClassificationConfidence } from "./classificationConfidenceCalibration";
import { validateOneClassificationPerSemanticUnit } from "./classificationPrecedence";

export const CANONICAL_CLASSIFICATION_PIPELINE_ID = "canonical-segmentation-classification-pipeline-v1";

export const classifyCanonicalInputConservatively = (
  request: SemanticSegmentationRequest,
  segmenter: SemanticUnitSegmenter = new ConservativeSemanticUnitSegmenter(),
  classifier: CanonicalSemanticUnitClassifier = new ConservativeCanonicalSemanticUnitClassifier(),
): CanonicalInputClassificationResult => {
  const segmentation = segmenter.segment(request);
  const classifications = segmentation.units.map((unit) => calibrateCanonicalClassificationConfidence(classifier.classify(unit)).result);
  const cardinality = validateOneClassificationPerSemanticUnit(
    segmentation.units.map((unit) => unit.semanticUnitId), classifications.map((classification) => classification.semanticUnitId),
  );
  if (cardinality.status !== "VALID" || classifications.some((classification, index) =>
    classification.semanticUnitId !== segmentation.units[index]?.semanticUnitId ||
    classification.persistenceEffect !== "NONE" || classification.authorityEffect !== "UNCHANGED" ||
    classification.executionPermissionGranted !== false,
  )) {
    throw new Error("canonical classification pipeline rejects invalid-cardinality, misaligned, or effect-bearing classifier results");
  }
  return { segmentation, classifications, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
};
