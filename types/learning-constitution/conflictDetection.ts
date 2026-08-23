import type { ClassificationProvenance } from "./informationClassification";
import type { KnowledgeClassification, ConflictRelationship } from "./constitutionalVocabulary";
import type { KnowledgeScopeReference, ScopeCompatibilityResult } from "./knowledgeScope";

export const CONFLICT_DETECTION_STATUSES = [
  "ASSESSED",
  "UNCERTAIN",
  "OUT_OF_SCOPE",
] as const;
export type ConflictDetectionStatus = (typeof CONFLICT_DETECTION_STATUSES)[number];

export type KnowledgeComparisonSubject = Readonly<{
  knowledgeId: string;
  content: string;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  provenance: ClassificationProvenance;
  semanticKey?: string;
  value?: string;
  qualifiers?: readonly string[];
  supersedesKnowledgeIds?: readonly string[];
  exceptionToKnowledgeIds?: readonly string[];
}>;

export type ConflictDetectionRequest = Readonly<{
  candidate: KnowledgeComparisonSubject;
  existingKnowledge: KnowledgeComparisonSubject;
}>;

export type ConflictReasoningMetadata = Readonly<{
  rationaleCode: string;
  matchedFields: readonly string[];
  detectorId: string;
  detectorVersion: string;
}>;

export type ConflictDetectionResult = Readonly<{
  candidateId: string;
  existingKnowledgeId: string;
  relationship: ConflictRelationship;
  confidence: number;
  status: ConflictDetectionStatus;
  scopeCompatibility: ScopeCompatibilityResult;
  provenance: Readonly<{
    candidate: ClassificationProvenance;
    existingKnowledge: ClassificationProvenance;
  }>;
  reasoningMetadata: ConflictReasoningMetadata;
  correctionTargetKnowledgeId?: string;
  exceptionTargetKnowledgeId?: string;
  requiresValidation: boolean;
  requiresClarification: boolean;
  requiresApproval: boolean;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
}>;

export interface ConflictDetector {
  detect(request: ConflictDetectionRequest): Promise<ConflictDetectionResult>;
}
