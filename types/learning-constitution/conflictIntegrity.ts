import type { ConflictStatus } from "./conflictEngine";

/** Read-only diagnostic result; scanning never creates, resolves, or alters knowledge. */
export const CONFLICT_INTEGRITY_FINDING_CODES = [
  "CONFLICT_MISSING_FINAL_RESOLUTION",
  "RESOLUTION_MISSING_DECISION",
  "RESOLUTION_REFERENCES_MISSING_KNOWLEDGE",
  "SUPERSESSION_MISSING_SUCCESSOR_LINK",
  "SUPERSEDED_KNOWLEDGE_STILL_CURRENT",
] as const;
export type ConflictIntegrityFindingCode = (typeof CONFLICT_INTEGRITY_FINDING_CODES)[number];

export type ConflictIntegrityFinding = Readonly<{
  code: ConflictIntegrityFindingCode;
  conflictId?: string;
  knowledgeId?: string;
  relatedRecordIds: readonly string[];
  message: string;
}>;

export type ConflictIntegrityReport = Readonly<{
  valid: boolean;
  scannedAt: string;
  findings: readonly ConflictIntegrityFinding[];
  unresolvedConflictStatuses: readonly ConflictStatus[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
