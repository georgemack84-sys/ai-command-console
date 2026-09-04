import type { AuthorityBoundaryResult } from "./authorityBoundary";
import type { AuthorityConflictResult } from "./authorityConflict";
import type { AuthorityRecord } from "./authorityRecord";
import type { AuthorityResolutionResult } from "./authorityResolution";

export const AUTHORITY_GATE_DECISIONS = ["ALLOW", "REVIEW", "DENY"] as const;
export type AuthorityGateDecision = (typeof AUTHORITY_GATE_DECISIONS)[number];
export const AUTHORITY_GATE_REASON_CODES = ["AUTHORITY_ACCEPTED", "UNKNOWN_AUTHORITY", "AMBIGUOUS_SOURCE", "INVALID_AUTHORITY_RECORD", "MISSING_APPROVAL", "INVALID_DELEGATION", "OUT_OF_SCOPE_AUTHORITY", "UNRESOLVED_SCOPE_BOUNDARY", "UNRESOLVED_CONFLICT", "CONFLICT_REJECTED", "SUPERSESSION_REQUIRES_LIFECYCLE", "SOURCE_LINEAGE_MISMATCH", "AUTHORITY_RECORD_MISMATCH"] as const;
export type AuthorityGateReasonCode = (typeof AUTHORITY_GATE_REASON_CODES)[number];

export type AuthorityGateRequest = Readonly<{
  resolution: AuthorityResolutionResult;
  authorityRecord?: AuthorityRecord;
  boundary?: AuthorityBoundaryResult;
  conflict?: AuthorityConflictResult;
  delegationValid?: boolean;
}>;

export type AuthorityGateResult = Readonly<{
  decision: AuthorityGateDecision;
  reasonCode: AuthorityGateReasonCode;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
export interface AuthorityGate { evaluate(request: AuthorityGateRequest): AuthorityGateResult; }

export const AUTHORITY_LEDGER_EVENT_TYPES = ["AUTHORITY_ASSIGNED", "AUTHORITY_CHANGED", "AUTHORITY_CHALLENGED", "AUTHORITY_CONFIRMED", "AUTHORITY_REVOKED", "KNOWLEDGE_SUPERSEDED", "CONFLICT_DETECTED", "CONFLICT_RESOLVED", "PROMOTION_APPROVED", "PROMOTION_REJECTED"] as const;
export type AuthorityLedgerEventType = (typeof AUTHORITY_LEDGER_EVENT_TYPES)[number];
export type AuthorityLedgerEvent = Readonly<{
  eventId: string;
  eventType: AuthorityLedgerEventType;
  authorityId: string;
  occurredAt: string;
  reason: string;
  relatedAuthorityId?: string;
  authorityRecord?: AuthorityRecord;
  previousAuthorityType?: AuthorityRecord["authorityType"];
  newAuthorityType?: AuthorityRecord["authorityType"];
  authorizedBy?: string;
  evidenceIds?: readonly string[];
}>;
export interface AuthorityLedger {
  append<T extends AuthorityLedgerEvent>(event: T): Promise<T>;
  findByAuthorityId(authorityId: string): Promise<readonly AuthorityLedgerEvent[]>;
  findAll(): Promise<readonly AuthorityLedgerEvent[]>;
}
