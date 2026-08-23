import type { KnowledgeClassification } from "./constitutionalVocabulary";
import type { DurableKnowledgeRecord, KnowledgeReview } from "./durableKnowledge";
import type { KnowledgeScopeReference } from "./knowledgeScope";

export type KnowledgeReviewPolicy = Readonly<{
  policyId: string;
  classification: KnowledgeClassification;
  scope?: KnowledgeScopeReference;
  reviewIntervalDays: number;
  overdueGraceDays: number;
  policyVersion: string;
}>;

export const KNOWLEDGE_FRESHNESS_STATUSES = [
  "CURRENT",
  "REVIEW_DUE",
  "OVERDUE",
  "NO_REVIEW_POLICY",
  "INVALID_POLICY",
] as const;
export type KnowledgeFreshnessStatus = (typeof KNOWLEDGE_FRESHNESS_STATUSES)[number];

export const KNOWLEDGE_FRESHNESS_REASON_CODES = [
  "REVIEW_WINDOW_OPEN",
  "REVIEW_DUE_BY_POLICY",
  "REVIEW_OVERDUE_BY_POLICY",
  "NO_MATCHING_REVIEW_POLICY",
  "REVIEW_POLICY_INVALID",
] as const;
export type KnowledgeFreshnessReasonCode = (typeof KNOWLEDGE_FRESHNESS_REASON_CODES)[number];

export type KnowledgeFreshnessAssessment = Readonly<{
  knowledgeId: string;
  status: KnowledgeFreshnessStatus;
  reasonCode: KnowledgeFreshnessReasonCode;
  basisTimestamp?: string;
  reviewDueAt?: string;
  selectedPolicyId?: string;
  selectedPolicyVersion?: string;
  latestReviewId?: string;
  recommendedAction: "NONE" | "REVALIDATE" | "REVIEW_FOR_QUARANTINE";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeFreshnessEvaluator {
  assess(record: DurableKnowledgeRecord, latestReview?: KnowledgeReview): KnowledgeFreshnessAssessment;
}
