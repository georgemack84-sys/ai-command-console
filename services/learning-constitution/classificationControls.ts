import type {
  ClassificationControlAssessment,
  ClassificationControlRequest,
  ClassificationControlResolver,
  CanonicalClassificationResult,
} from "../../types/learning-constitution";
import { analyzeSemanticModifiers } from "./semanticModifiers";

export const resolveClassificationControlsConservatively: ClassificationControlResolver = (
  request: ClassificationControlRequest,
  classifications: readonly CanonicalClassificationResult[],
): ClassificationControlAssessment => {
  if (request.explicitUserCategory && request.provenance.sourceType !== "OPERATOR_STATEMENT") {
    throw new Error("explicit user category claims require an operator statement source");
  }
  const modifiers = analyzeSemanticModifiers(request.content).modifiers;
  const learningIntent = modifiers.includes("NON_LEARNING") ? "EXPLICIT_NON_LEARNING" : request.explicitLearningIntent ?? "UNSPECIFIED";
  const handling = classifications.some((classification) => classification.status !== "CLASSIFIED") ? "SILENT_CONSERVATIVE" : "NORMAL";
  return {
    ...(request.explicitUserCategory ? { userCategoryClaim: { category: request.explicitUserCategory, status: "RECORDED_FOR_REVIEW" as const } } : {}),
    learningIntent, handling, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
  };
};
