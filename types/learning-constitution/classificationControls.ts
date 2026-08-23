import type { CanonicalClassificationResult } from "./canonicalClassification";
import type { CanonicalInformationCategory } from "./canonicalTaxonomy";
import type { ClassificationProvenance } from "./informationClassification";

export type ClassificationControlRequest = Readonly<{
  provenance: ClassificationProvenance;
  content: string;
  explicitUserCategory?: CanonicalInformationCategory;
  explicitLearningIntent?: "EXPLICIT_LEARNING" | "EXPLICIT_NON_LEARNING";
}>;

export type ClassificationControlAssessment = Readonly<{
  userCategoryClaim?: Readonly<{ category: CanonicalInformationCategory; status: "RECORDED_FOR_REVIEW" }>;
  learningIntent: "UNSPECIFIED" | "EXPLICIT_LEARNING" | "EXPLICIT_NON_LEARNING";
  handling: "NORMAL" | "SILENT_CONSERVATIVE";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type ClassificationControlResolver = (
  request: ClassificationControlRequest,
  classifications: readonly CanonicalClassificationResult[],
) => ClassificationControlAssessment;
