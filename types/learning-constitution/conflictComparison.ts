import type { AuthorityRelationshipIntent } from "./authorityPrecedence";
import type { AuthorityRecord } from "./authorityRecord";
import type { ConflictComparison } from "./conflictEngine";
import type { KnowledgeEvidence } from "./knowledgeValidation";
import type { KnowledgeScopeReference } from "./knowledgeScope";

export type ConflictComparisonSubject = Readonly<{
  scope: KnowledgeScopeReference;
  authority?: AuthorityRecord;
  evidence: readonly KnowledgeEvidence[];
  confidence?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
}>;

export type ConflictComparisonRequest = Readonly<{
  existing: ConflictComparisonSubject;
  candidate: ConflictComparisonSubject;
  authorityRelationshipIntent?: AuthorityRelationshipIntent;
}>;

export type ConflictDimensionComparisons = Readonly<{
  scope: ConflictComparison;
  authority: ConflictComparison;
  evidence: ConflictComparison;
  confidence: ConflictComparison;
  temporal: ConflictComparison;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
