import type { CanonicalInformationCategory } from "./canonicalTaxonomy";
import type { ContextualCanonicalInputClassificationResult, ContextualClassificationInputRequest } from "./classificationContext";

export type TaxonomyCategoryDeprecation = Readonly<{
  categoryId: string;
  deprecated: true;
  deprecatedSince: string;
  replacementCategory?: CanonicalInformationCategory;
  migrationRule: string;
  removalVersion: string;
}>;

export type TaxonomyExtensionAnalysis = Readonly<{
  proposedCategoryId: string;
  semanticDefinition: string;
  existingCategoryGap: string;
  nearestSemanticNeighbors: readonly CanonicalInformationCategory[];
  uniqueDownstreamBehavior: string;
  positiveExamples: readonly string[];
  counterexamples: readonly string[];
  doesNotImply: readonly string[];
  durabilityInteraction: string;
  authorityInteraction: string;
  promotionInteraction: string;
  requiresReclassification: boolean;
  migrationRequirement: string;
}>;

export type CanonicalClassificationReplayRecord = Readonly<{
  recordId: string;
  recordedAt: string;
  classifierVersion: string;
  taxonomyVersion: string;
  policyVersion: string;
  contextReferences: readonly string[];
  configuration: Readonly<{ maximumContextFrames: number }>;
  request: ContextualClassificationInputRequest;
  result: ContextualCanonicalInputClassificationResult;
  resultFingerprint: string;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type CanonicalClassificationReplayResult = Readonly<{
  reproducible: boolean;
  expectedFingerprint: string;
  observedFingerprint: string;
  result: ContextualCanonicalInputClassificationResult;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
