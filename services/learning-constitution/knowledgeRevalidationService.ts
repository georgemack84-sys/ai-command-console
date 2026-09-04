import type {
  KnowledgeAuditLedger,
  KnowledgeRevalidationReasonCode,
  KnowledgeRevalidationRequest,
  KnowledgeRevalidationResult,
  KnowledgeRevalidationService as KnowledgeRevalidationServiceContract,
  KnowledgeReview,
  KnowledgeReviewAuditEvent,
  KnowledgeReviewRepository,
} from "../../types/learning-constitution/durableKnowledge";

export const KNOWLEDGE_REVALIDATION_SERVICE_ID = "phase-0-knowledge-revalidation-service";

type RevalidationDependencies = Readonly<{
  repository: KnowledgeReviewRepository;
  auditLedger: KnowledgeAuditLedger;
  now?: () => string;
  createAuditEventId?: (reviewId: string) => string;
}>;

const result = (
  status: KnowledgeRevalidationResult["status"],
  reasonCode: KnowledgeRevalidationReasonCode,
  values: Pick<KnowledgeRevalidationResult, "knowledgeRecord" | "review" | "auditEvent" | "recommendedLifecycleState" | "created" | "idempotentReplay" | "persistenceEffect">,
): KnowledgeRevalidationResult => ({
  status,
  reasonCode,
  ...values,
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const rejected = (reasonCode: KnowledgeRevalidationReasonCode): KnowledgeRevalidationResult =>
  result("REJECTED", reasonCode, { created: false, idempotentReplay: false, persistenceEffect: "NONE" });

export class KnowledgeRevalidationService implements KnowledgeRevalidationServiceContract {
  constructor(private readonly dependencies: RevalidationDependencies) {}

  async revalidate(request: KnowledgeRevalidationRequest): Promise<KnowledgeRevalidationResult> {
    const existing = await this.dependencies.repository.findReviewById(request.reviewId);
    if (existing) {
      if (existing.knowledgeId !== request.knowledgeId || existing.outcome !== request.outcome) {
        return rejected("REVIEW_ID_CONFLICT");
      }
      return result(existing.outcome === "CONFIRMED" ? "REVALIDATED" : "REVIEW_FAILED", "IDEMPOTENT_REPLAY", {
        review: existing,
        created: false,
        idempotentReplay: true,
        persistenceEffect: "NONE",
        recommendedLifecycleState: existing.outcome === "CONFIRMED" ? undefined : "QUARANTINED",
      });
    }

    const knowledgeRecord = await this.dependencies.repository.getById(request.knowledgeId);
    if (!knowledgeRecord) return rejected("KNOWLEDGE_NOT_FOUND");
    if (knowledgeRecord.lifecycleState !== "ACTIVE") return rejected("KNOWLEDGE_NOT_ACTIVE");
    if (!request.evidenceIds.length || request.evidenceIds.some((id) => !id.trim())) return rejected("EVIDENCE_MISSING");
    if (!request.reviewerId.trim()) return rejected("REVIEWER_MISSING");
    if (!knowledgeRecord.policyVersion || !knowledgeRecord.constitutionVersion || !knowledgeRecord.lineage.candidateId) {
      return rejected("LINEAGE_INCONSISTENT");
    }

    const reviewedAt = this.dependencies.now?.() ?? new Date().toISOString();
    const review: KnowledgeReview = {
      reviewId: request.reviewId,
      knowledgeId: knowledgeRecord.knowledgeId,
      outcome: request.outcome,
      evidenceIds: [...request.evidenceIds],
      reviewerId: request.reviewerId.trim(),
      reviewedAt,
      policyVersion: knowledgeRecord.policyVersion,
      constitutionVersion: knowledgeRecord.constitutionVersion,
      provenance: knowledgeRecord.provenance,
    };
    const eventType = request.outcome === "CONFIRMED" ? "KNOWLEDGE_REVALIDATED" as const : "KNOWLEDGE_REVIEW_FAILED" as const;
    const reasonCode = request.outcome === "CONFIRMED"
      ? "KNOWLEDGE_REVALIDATED" as const
      : request.outcome === "UNVERIFIABLE"
        ? "EVIDENCE_UNVERIFIABLE" as const
        : "EVIDENCE_CONTRADICTED" as const;
    try {
      const createdReview = await this.dependencies.repository.createReview(review);
      const auditEvent: KnowledgeReviewAuditEvent = {
        eventId: this.dependencies.createAuditEventId?.(review.reviewId) ?? `audit:review:${review.reviewId}`,
        eventType,
        reviewId: review.reviewId,
        knowledgeId: review.knowledgeId,
        outcome: review.outcome,
        occurredAt: reviewedAt,
        policyVersion: review.policyVersion,
        constitutionVersion: review.constitutionVersion,
        provenance: review.provenance,
      };
      const emittedAuditEvent = await this.dependencies.auditLedger.append(auditEvent);
      return result(request.outcome === "CONFIRMED" ? "REVALIDATED" : "REVIEW_FAILED", reasonCode, {
        knowledgeRecord,
        review: createdReview,
        auditEvent: emittedAuditEvent,
        recommendedLifecycleState: request.outcome === "CONFIRMED" ? undefined : "QUARANTINED",
        created: true,
        idempotentReplay: false,
        persistenceEffect: "CREATED",
      });
    } catch {
      return result("PERSISTENCE_FAILED", "PERSISTENCE_FAILED", {
        created: false,
        idempotentReplay: false,
        persistenceEffect: "NONE",
      });
    }
  }
}
