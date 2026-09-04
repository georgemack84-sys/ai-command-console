import type { CanonicalInformationCategory, TaxonomyProcessingStatus } from "./canonicalTaxonomy";
import type { SemanticSegmentationResult, SemanticUnit } from "./semanticUnit";
import type { ClassificationBasis } from "./classificationAttribution";
import type { SemanticModifier } from "./semanticModifiers";

export type CanonicalClassificationEvidence = Readonly<{
  code: string;
  matchedText: string;
}>;

export type CanonicalClassificationCandidate = Readonly<{
  category: CanonicalInformationCategory;
  confidence: number;
}>;

export type CanonicalClassificationResult = Readonly<{
  semanticUnitId: string;
  taxonomyVersion: "1.0.0";
  classifierId: string;
  classifierVersion: string;
  classificationBasis: ClassificationBasis;
  semanticModifiers: readonly SemanticModifier[];
  status: TaxonomyProcessingStatus;
  category?: CanonicalInformationCategory;
  candidates: readonly CanonicalClassificationCandidate[];
  confidence: number;
  reasonCodes: readonly string[];
  evidence: readonly CanonicalClassificationEvidence[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface CanonicalSemanticUnitClassifier {
  classify(unit: SemanticUnit): CanonicalClassificationResult;
}

export type CanonicalInputClassificationResult = Readonly<{
  segmentation: SemanticSegmentationResult;
  classifications: readonly CanonicalClassificationResult[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
