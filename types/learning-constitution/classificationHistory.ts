import type { CanonicalClassificationResult } from "./canonicalClassification";
import type { CanonicalInformationCategory } from "./canonicalTaxonomy";

export const CLASSIFICATION_RELATION_TYPES = [
  "SUPPORTS", "CONTRADICTS", "CORRECTS", "SUPERSEDES", "EXCEPTS", "IMPLEMENTS", "ILLUSTRATES", "DERIVED_FROM", "RESPONDS_TO", "PROMOTES", "SELECTED_FROM",
] as const;
export type ClassificationRelationType = (typeof CLASSIFICATION_RELATION_TYPES)[number];

export type ClassificationUnitRelationship = Readonly<{
  relationshipId: string;
  fromSemanticUnitId: string;
  toSemanticUnitId: string;
  type: ClassificationRelationType;
  status: "PROPOSED" | "RECORDED";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
}>;

export type ClassificationHistoryChangeKind = "INITIAL" | "RECLASSIFICATION" | "MANUAL_OVERRIDE";

export type ClassificationHistoryEntry = Readonly<{
  semanticUnitId: string;
  revision: number;
  recordedAt: string;
  changeKind: ClassificationHistoryChangeKind;
  reason: string;
  result: CanonicalClassificationResult;
}>;

export type ClassificationHistory = Readonly<{
  semanticUnitId: string;
  entries: readonly ClassificationHistoryEntry[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
}>;

export type ManualClassificationOverrideRequest = Readonly<{
  reviewerId: string;
  reason: string;
  recordedAt: string;
  newCategory: CanonicalInformationCategory;
}>;

export type ManualClassificationOverrideResult = Readonly<{
  override: Readonly<{
    previousCategory: CanonicalInformationCategory;
    newCategory: CanonicalInformationCategory;
    reviewerId: string;
    reason: string;
    recordedAt: string;
  }>;
  history: ClassificationHistory;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
