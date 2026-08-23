import type { KnowledgeScopeReference } from "./knowledgeScope";

/** Phase 8's canonical reason a pair of knowledge records requires governed treatment. */
export const CONFLICT_TYPES = [
  "DIRECT_CONTRADICTION",
  "PARTIAL_CONTRADICTION",
  "SCOPE_COLLISION",
  "AUTHORITY_COLLISION",
  "EVIDENCE_COLLISION",
  "TEMPORAL_CONFLICT",
  "CORRECTION_CONFLICT",
  "EXCEPTION_CONFLICT",
  "DUPLICATE_OR_OVERLAP",
  "AMBIGUOUS_CONFLICT",
] as const;
export type ConflictType = (typeof CONFLICT_TYPES)[number];

export const CONFLICT_STATUSES = [
  "DETECTED",
  "UNDER_ANALYSIS",
  "RESOLUTION_PROPOSED",
  "AWAITING_CLARIFICATION",
  "AWAITING_APPROVAL",
  "ESCALATED",
  "DEFERRED",
  "RESOLVED",
  "REJECTED",
  "CANCELLED",
] as const;
export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];

export const CONFLICT_RESOLUTION_OUTCOMES = [
  "NO_CONFLICT",
  "MERGE",
  "SUPERSEDE",
  "NARROW_SCOPE",
  "CREATE_EXCEPTION",
  "REQUEST_CLARIFICATION",
  "ESCALATE",
  "REJECT",
] as const;
export type ConflictResolutionOutcome = (typeof CONFLICT_RESOLUTION_OUTCOMES)[number];

export type ConflictComparison = Readonly<{
  existing: string;
  candidate: string;
  outcome: "EXISTING_STRONGER" | "CANDIDATE_STRONGER" | "EQUIVALENT" | "INCOMPARABLE" | "UNKNOWN";
  rationaleCode: string;
}>;

/**
 * An immutable reference object. It deliberately contains IDs and comparison
 * snapshots rather than mutable copies of either knowledge record.
 */
export type ConflictRecord = Readonly<{
  id: string;
  recordType: "CONFLICT";
  existingKnowledgeId: string;
  candidateKnowledgeId: string;
  type: ConflictType;
  scope: KnowledgeScopeReference;
  authorityComparison: ConflictComparison;
  evidenceComparison: ConflictComparison;
  confidenceComparison: ConflictComparison;
  provenanceRefs: readonly string[];
  proposedOutcome?: ConflictResolutionOutcome;
  resolutionReasoning: string;
  status: ConflictStatus;
  createdAt: string;
  resolvedAt?: string;
  resolutionProvenanceRef?: string;
  immutable: true;
}>;

export type ConflictRecordDraft = Readonly<Omit<ConflictRecord, "id" | "recordType" | "createdAt" | "immutable" | "status"> & {
  status?: Extract<ConflictStatus, "DETECTED" | "UNDER_ANALYSIS" | "RESOLUTION_PROPOSED" | "AWAITING_CLARIFICATION" | "AWAITING_APPROVAL" | "ESCALATED" | "DEFERRED">;
}>;
