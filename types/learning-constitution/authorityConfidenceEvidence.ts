import type { AuthorityRecord } from "./authorityRecord";
import type { KnowledgeEvidence } from "./knowledgeValidation";

export type AuthorityAxis = Readonly<{ state: "UNASSESSED" }> | Readonly<{ state: "RECORDED"; record: AuthorityRecord }>;
export type ConfidenceAxis = Readonly<{ score: number; basis: readonly string[] }>;
export type EvidenceAxis = Readonly<{ items: readonly KnowledgeEvidence[] }>;

/** The three axes are intentionally stored and evaluated independently. */
export type AuthorityConfidenceEvidenceProfile = Readonly<{
  authority: AuthorityAxis;
  confidence: ConfidenceAxis;
  evidence: EvidenceAxis;
}>;

export type AuthorityConfidenceEvidenceEvaluation = Readonly<{
  profile: AuthorityConfidenceEvidenceProfile;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
