import type { AuthorityConfidenceEvidenceProfile } from "./authorityConfidenceEvidence";
import type { AuthorityLedgerEvent } from "./authorityEnforcement";
import type { AuthorityRecord } from "./authorityRecord";

export type AuthorityExplanationRequest = Readonly<{ authority: AuthorityRecord; profile: AuthorityConfidenceEvidenceProfile }>;
export type AuthorityExplanation = Readonly<{
  authority: AuthorityRecord;
  confidence: AuthorityConfidenceEvidenceProfile["confidence"];
  evidenceIds: readonly string[];
  provenance: AuthorityRecord["provenance"];
  supersedes: readonly string[];
  events: readonly AuthorityLedgerEvent[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
export interface AuthorityExplanationService { explain(request: AuthorityExplanationRequest): Promise<AuthorityExplanation>; }
