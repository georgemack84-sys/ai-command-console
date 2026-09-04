import type { AuditIntegrityEntry } from "./durableKnowledge";

export type AuditIntegrityVerificationRequest = Readonly<{ auditKey: string }>;

export type AuditIntegrityVerificationResult = Readonly<{
  auditKey: string;
  status: "VALID" | "CHAIN_BROKEN" | "EVENT_MISSING" | "HASH_MISMATCH" | "INSUFFICIENT_HISTORY" | "VERIFICATION_FAILED";
  verifiedEntryCount: number;
  brokenAtSequence?: number;
  brokenEventId?: string;
  entries: readonly AuditIntegrityEntry[];
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface AuditIntegrityVerifier {
  verify(request: AuditIntegrityVerificationRequest): Promise<AuditIntegrityVerificationResult>;
}
