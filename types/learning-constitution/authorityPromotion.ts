import type { AuthorityRecord } from "./authorityRecord";
import type { AuthorityType } from "./authorityTaxonomy";

export const AUTHORITY_PROMOTION_STATUSES = ["APPROVED", "REJECTED", "REVIEW_REQUIRED"] as const;
export type AuthorityPromotionStatus = (typeof AUTHORITY_PROMOTION_STATUSES)[number];
export const AUTHORITY_PROMOTION_REASON_CODES = ["AGENT_PROMOTION_APPROVED", "HUMAN_AUTHORITY_REQUIRES_HUMAN_ESTABLISHMENT", "PROMOTION_EVIDENCE_REQUIRED", "PROMOTION_AUTHORIZER_REQUIRED", "UNSUPPORTED_PROMOTION", "NO_AUTHORITY_CHANGE"] as const;
export type AuthorityPromotionReasonCode = (typeof AUTHORITY_PROMOTION_REASON_CODES)[number];

export type AuthorityPromotionEvent = Readonly<{
  eventId: string;
  recordId: string;
  previousAuthority: AuthorityType;
  newAuthority: AuthorityType;
  authorizedBy: string;
  reason: string;
  timestamp: string;
  evidenceIds: readonly string[];
}>;
export type AuthorityPromotionRequest = Readonly<{
  eventId: string;
  record: AuthorityRecord;
  newAuthority: AuthorityType;
  authorizedBy: string;
  reason: string;
  timestamp: string;
  evidenceIds: readonly string[];
}>;
export type AuthorityPromotionResult = Readonly<{
  status: AuthorityPromotionStatus;
  reasonCode: AuthorityPromotionReasonCode;
  event: AuthorityPromotionEvent;
  persistenceEffect: "CREATED";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;
export interface AuthorityPromotionService { promote(request: AuthorityPromotionRequest): Promise<AuthorityPromotionResult>; }
