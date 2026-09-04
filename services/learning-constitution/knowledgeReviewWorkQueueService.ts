import type {
  KnowledgeAuditLedger,
  KnowledgeRepository,
  KnowledgeReviewWorkItemAuditEvent,
  KnowledgeReviewRepository,
} from "../../types/learning-constitution/durableKnowledge";
import type {
  KnowledgeReviewWorkCompletionRequest,
  KnowledgeReviewWorkEnqueueRequest,
  KnowledgeReviewWorkQueueRepository,
  KnowledgeReviewWorkQueueService as KnowledgeReviewWorkQueueServiceContract,
  KnowledgeReviewWorkReasonCode,
  KnowledgeReviewWorkResult,
} from "../../types/learning-constitution/knowledgeReviewQueue";

export const KNOWLEDGE_REVIEW_WORK_QUEUE_SERVICE_ID = "phase-0-knowledge-review-work-queue-service";

type QueueDependencies = Readonly<{
  knowledgeRepository: KnowledgeRepository;
  reviewRepository: KnowledgeReviewRepository;
  queueRepository: KnowledgeReviewWorkQueueRepository;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
}>;

const result = (
  status: KnowledgeReviewWorkResult["status"],
  reasonCode: KnowledgeReviewWorkReasonCode,
  values: Pick<KnowledgeReviewWorkResult, "workItem" | "created" | "idempotentReplay" | "persistenceEffect">,
): KnowledgeReviewWorkResult => ({
  status, reasonCode, ...values, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

const rejected = (reasonCode: KnowledgeReviewWorkReasonCode): KnowledgeReviewWorkResult =>
  result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });

export class KnowledgeReviewWorkQueueService implements KnowledgeReviewWorkQueueServiceContract {
  constructor(private readonly dependencies: QueueDependencies) {}

  async enqueue(request: KnowledgeReviewWorkEnqueueRequest): Promise<KnowledgeReviewWorkResult> {
    const knowledge = await this.dependencies.knowledgeRepository.getById(request.knowledgeId);
    if (!knowledge) return rejected("KNOWLEDGE_NOT_FOUND");
    if (knowledge.lifecycleState !== "ACTIVE") return rejected("KNOWLEDGE_NOT_ACTIVE");
    if (request.freshness.knowledgeId !== knowledge.knowledgeId) return rejected("FRESHNESS_MISMATCH");
    if (request.freshness.status !== "REVIEW_DUE" && request.freshness.status !== "OVERDUE") {
      return rejected("FRESHNESS_INELIGIBLE");
    }
    const existing = await this.dependencies.queueRepository.findOpenByKnowledgeId(knowledge.knowledgeId);
    if (existing) return result("QUEUED", "IDEMPOTENT_REPLAY", {
      workItem: existing, created: false, idempotentReplay: true, persistenceEffect: "NONE",
    });

    const now = this.dependencies.now?.() ?? new Date().toISOString();
    const workItem = {
      workItemId: `review-work:${knowledge.knowledgeId}:${request.freshness.reviewDueAt ?? now}`,
      knowledgeId: knowledge.knowledgeId,
      state: "QUEUED" as const,
      priority: request.freshness.status === "OVERDUE" ? "HIGH" as const : "NORMAL" as const,
      freshness: request.freshness,
      createdAt: now,
      policyVersion: knowledge.policyVersion,
      constitutionVersion: knowledge.constitutionVersion,
    };
    try {
      const created = await this.dependencies.queueRepository.create(workItem);
      const event: KnowledgeReviewWorkItemAuditEvent = {
        eventId: `audit:review-work-queued:${created.workItemId}`,
        eventType: "KNOWLEDGE_REVIEW_WORK_QUEUED",
        workItemId: created.workItemId,
        knowledgeId: created.knowledgeId,
        occurredAt: now,
        policyVersion: created.policyVersion,
        constitutionVersion: created.constitutionVersion,
        provenance: knowledge.provenance,
      };
      await this.dependencies.auditLedger.append(event);
      return result("QUEUED", "REVIEW_WORK_QUEUED", {
        workItem: created, created: true, idempotentReplay: false, persistenceEffect: "CREATED",
      });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", {
        created: false, idempotentReplay: false, persistenceEffect: "NONE",
      });
    }
  }

  async complete(request: KnowledgeReviewWorkCompletionRequest): Promise<KnowledgeReviewWorkResult> {
    const item = await this.dependencies.queueRepository.getById(request.workItemId);
    if (!item) return rejected("WORK_ITEM_NOT_FOUND");
    const review = await this.dependencies.reviewRepository.findReviewById(request.reviewId);
    if (!review) return rejected("REVIEW_NOT_FOUND");
    if (review.knowledgeId !== item.knowledgeId) return rejected("REVIEW_TARGET_MISMATCH");
    if (item.state === "COMPLETED") return result("COMPLETED", "IDEMPOTENT_REPLAY", {
      workItem: item, created: false, idempotentReplay: true, persistenceEffect: "NONE",
    });
    if (item.state !== "QUEUED" && item.state !== "IN_REVIEW") return rejected("WORK_ITEM_NOT_OPEN");
    const knowledge = await this.dependencies.knowledgeRepository.getById(item.knowledgeId);
    if (!knowledge) return rejected("KNOWLEDGE_NOT_FOUND");

    const now = this.dependencies.now?.() ?? new Date().toISOString();
    try {
      const completed = await this.dependencies.queueRepository.complete(item.workItemId, review, now);
      const event: KnowledgeReviewWorkItemAuditEvent = {
        eventId: `audit:review-work-completed:${completed.workItemId}`,
        eventType: "KNOWLEDGE_REVIEW_WORK_COMPLETED",
        workItemId: completed.workItemId,
        knowledgeId: completed.knowledgeId,
        occurredAt: now,
        policyVersion: completed.policyVersion,
        constitutionVersion: completed.constitutionVersion,
        provenance: knowledge.provenance,
      };
      await this.dependencies.auditLedger.append(event);
      return result("COMPLETED", "REVIEW_WORK_COMPLETED", {
        workItem: completed, created: true, idempotentReplay: false, persistenceEffect: "UPDATED",
      });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", {
        created: false, idempotentReplay: false, persistenceEffect: "NONE",
      });
    }
  }
}
