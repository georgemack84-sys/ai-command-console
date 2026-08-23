import type { KnowledgeReview } from "./durableKnowledge";
import type { KnowledgeFreshnessAssessment } from "./knowledgeFreshness";

export const KNOWLEDGE_REVIEW_WORK_ITEM_STATES = [
  "QUEUED",
  "IN_REVIEW",
  "COMPLETED",
  "CANCELLED",
] as const;
export type KnowledgeReviewWorkItemState = (typeof KNOWLEDGE_REVIEW_WORK_ITEM_STATES)[number];

export type KnowledgeReviewWorkItem = Readonly<{
  workItemId: string;
  knowledgeId: string;
  state: KnowledgeReviewWorkItemState;
  priority: "NORMAL" | "HIGH";
  freshness: KnowledgeFreshnessAssessment;
  createdAt: string;
  completedAt?: string;
  completedReviewId?: string;
  policyVersion: string;
  constitutionVersion: string;
}>;

export type KnowledgeReviewWorkQueueRepository = Readonly<{
  create(item: KnowledgeReviewWorkItem): Promise<KnowledgeReviewWorkItem>;
  getById(workItemId: string): Promise<KnowledgeReviewWorkItem | undefined>;
  findOpenByKnowledgeId(knowledgeId: string): Promise<KnowledgeReviewWorkItem | undefined>;
  complete(workItemId: string, review: KnowledgeReview, completedAt: string): Promise<KnowledgeReviewWorkItem>;
  findAll(): Promise<readonly KnowledgeReviewWorkItem[]>;
}>;

export type KnowledgeReviewWorkEnqueueRequest = Readonly<{
  knowledgeId: string;
  freshness: KnowledgeFreshnessAssessment;
}>;

export type KnowledgeReviewWorkCompletionRequest = Readonly<{
  workItemId: string;
  reviewId: string;
}>;

export const KNOWLEDGE_REVIEW_WORK_STATUSES = [
  "QUEUED",
  "COMPLETED",
  "REJECTED",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeReviewWorkStatus = (typeof KNOWLEDGE_REVIEW_WORK_STATUSES)[number];

export const KNOWLEDGE_REVIEW_WORK_REASON_CODES = [
  "REVIEW_WORK_QUEUED",
  "REVIEW_WORK_COMPLETED",
  "IDEMPOTENT_REPLAY",
  "KNOWLEDGE_NOT_FOUND",
  "KNOWLEDGE_NOT_ACTIVE",
  "FRESHNESS_INELIGIBLE",
  "FRESHNESS_MISMATCH",
  "WORK_ITEM_NOT_FOUND",
  "REVIEW_NOT_FOUND",
  "REVIEW_TARGET_MISMATCH",
  "WORK_ITEM_NOT_OPEN",
  "PERSISTENCE_FAILED",
] as const;
export type KnowledgeReviewWorkReasonCode = (typeof KNOWLEDGE_REVIEW_WORK_REASON_CODES)[number];

export type KnowledgeReviewWorkResult = Readonly<{
  status: KnowledgeReviewWorkStatus;
  reasonCode: KnowledgeReviewWorkReasonCode;
  workItem?: KnowledgeReviewWorkItem;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "CREATED" | "UPDATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface KnowledgeReviewWorkQueueService {
  enqueue(request: KnowledgeReviewWorkEnqueueRequest): Promise<KnowledgeReviewWorkResult>;
  complete(request: KnowledgeReviewWorkCompletionRequest): Promise<KnowledgeReviewWorkResult>;
}
