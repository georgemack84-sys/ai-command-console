import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  InMemoryKnowledgeReviewWorkQueue,
  KnowledgeRevalidationService,
  KnowledgeReviewWorkQueueService,
} from "@/services/learning-constitution";
import type { DurableKnowledgeRecord, KnowledgeFreshnessAssessment } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-01T00:00:00.000Z",
};
const scope = { type: "PROJECT", id: "project-alpha" } as const;
const record = (overrides: Partial<DurableKnowledgeRecord> = {}): DurableKnowledgeRecord => ({
  knowledgeId: "knowledge-001", candidateId: "candidate-001", content: "Use PostgreSQL.", classification: "PROJECT_DECISION",
  scope, lifecycleState: "ACTIVE", createdAt: provenance.observedAt, effectiveFrom: provenance.observedAt, provenance,
  lineage: {
    candidateId: "candidate-001", observationId: provenance.observationId, classificationRationaleCode: "TEST",
    scopeRationaleCode: "TEST", conflictRelationship: "UNRELATED", validationOutcome: "VALID",
    decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
  }, policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});

const freshness = (
  status: "REVIEW_DUE" | "OVERDUE" = "REVIEW_DUE",
): KnowledgeFreshnessAssessment => ({
  knowledgeId: "knowledge-001", status,
  reasonCode: status === "OVERDUE" ? "REVIEW_OVERDUE_BY_POLICY" : "REVIEW_DUE_BY_POLICY",
  basisTimestamp: "2026-08-01T00:00:00.000Z", reviewDueAt: "2026-08-31T00:00:00.000Z",
  selectedPolicyId: "policy-001", selectedPolicyVersion: "1.0.0",
  recommendedAction: status === "OVERDUE" ? "REVIEW_FOR_QUARANTINE" : "REVALIDATE",
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

const setup = async () => {
  const repository = new InMemoryKnowledgeRepository();
  const ledger = new InMemoryKnowledgeAuditLedger();
  const queueRepository = new InMemoryKnowledgeReviewWorkQueue();
  await repository.create(record());
  const service = new KnowledgeReviewWorkQueueService({
    knowledgeRepository: repository, reviewRepository: repository, queueRepository, auditLedger: ledger,
    now: () => "2026-09-01T00:00:00.000Z",
  });
  return { repository, ledger, queueRepository, service };
};

describe("knowledge review work queue", () => {
  it("queues due and overdue knowledge with deterministic priority and audit history", async () => {
    const due = await setup();
    const dueResult = await due.service.enqueue({ knowledgeId: "knowledge-001", freshness: freshness() });
    expect(dueResult).toMatchObject({
      status: "QUEUED", reasonCode: "REVIEW_WORK_QUEUED", persistenceEffect: "CREATED",
      workItem: { state: "QUEUED", priority: "NORMAL" }, authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    });
    expect(await due.ledger.findByKnowledgeId("knowledge-001")).toHaveLength(1);

    const overdue = await setup();
    const overdueResult = await overdue.service.enqueue({ knowledgeId: "knowledge-001", freshness: freshness("OVERDUE") });
    expect(overdueResult.workItem?.priority).toBe("HIGH");
  });

  it("deduplicates open work by knowledge ID", async () => {
    const { service, ledger } = await setup();
    const first = await service.enqueue({ knowledgeId: "knowledge-001", freshness: freshness() });
    const replay = await service.enqueue({ knowledgeId: "knowledge-001", freshness: freshness("OVERDUE") });
    expect(replay).toMatchObject({ status: "QUEUED", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(replay.workItem?.workItemId).toBe(first.workItem?.workItemId);
    expect(await ledger.findByKnowledgeId("knowledge-001")).toHaveLength(1);
  });

  it("links queue completion to a persisted review of the same knowledge", async () => {
    const { repository, ledger, service } = await setup();
    const queued = await service.enqueue({ knowledgeId: "knowledge-001", freshness: freshness() });
    await new KnowledgeRevalidationService({ repository, auditLedger: ledger, now: () => "2026-09-01T01:00:00.000Z" })
      .revalidate({ reviewId: "review-001", knowledgeId: "knowledge-001", outcome: "CONFIRMED", evidenceIds: ["evidence-001"], reviewerId: "reviewer-001" });

    const completed = await service.complete({ workItemId: queued.workItem!.workItemId, reviewId: "review-001" });
    const replay = await service.complete({ workItemId: queued.workItem!.workItemId, reviewId: "review-001" });
    expect(completed).toMatchObject({
      status: "COMPLETED", reasonCode: "REVIEW_WORK_COMPLETED", persistenceEffect: "UPDATED",
      workItem: { state: "COMPLETED", completedReviewId: "review-001" },
    });
    expect(replay).toMatchObject({ status: "COMPLETED", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(await ledger.findByKnowledgeId("knowledge-001")).toHaveLength(3);
  });

  it("rejects ineligible freshness and missing review completion without mutation", async () => {
    const { service } = await setup();
    const current: KnowledgeFreshnessAssessment = { ...freshness(), status: "CURRENT", reasonCode: "REVIEW_WINDOW_OPEN", recommendedAction: "NONE" };
    const ineligible = await service.enqueue({ knowledgeId: "knowledge-001", freshness: current });
    const missingReview = await service.complete({ workItemId: "unknown", reviewId: "review-unknown" });
    expect(ineligible).toMatchObject({ status: "REJECTED", reasonCode: "FRESHNESS_INELIGIBLE" });
    expect(missingReview).toMatchObject({ status: "REJECTED", reasonCode: "WORK_ITEM_NOT_FOUND" });
  });
});
