import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeRetrievalService,
  KnowledgeRevalidationService,
} from "@/services/learning-constitution";
import type { DurableKnowledgeRecord, KnowledgeReviewRepository } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-20T12:00:00.000Z",
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

const request = (overrides: Partial<{
  reviewId: string; knowledgeId: string; outcome: "CONFIRMED" | "UNVERIFIABLE" | "CONTRADICTED"; evidenceIds: readonly string[]; reviewerId: string;
}> = {}) => ({
  reviewId: "review-001", knowledgeId: "knowledge-001", outcome: "CONFIRMED" as const,
  evidenceIds: ["evidence-001"], reviewerId: "reviewer-001", ...overrides,
});

describe("knowledge revalidation", () => {
  it("records confirmed evidence and exposes the latest review through retrieval", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await repository.create(record());
    const revalidation = await new KnowledgeRevalidationService({
      repository, auditLedger: ledger, now: () => "2026-08-20T15:00:00.000Z",
    }).revalidate(request());
    const retrieval = await new KnowledgeRetrievalService({ repository }).retrieve({ scope, knowledgeId: "knowledge-001" });

    expect(revalidation).toMatchObject({
      status: "REVALIDATED", reasonCode: "KNOWLEDGE_REVALIDATED", created: true,
      persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
      auditEvent: { eventType: "KNOWLEDGE_REVALIDATED" },
    });
    expect(retrieval.review).toMatchObject({ reviewId: "review-001", outcome: "CONFIRMED" });
    expect(await ledger.findByKnowledgeId("knowledge-001")).toHaveLength(1);
  });

  it.each([
    ["UNVERIFIABLE", "EVIDENCE_UNVERIFIABLE"],
    ["CONTRADICTED", "EVIDENCE_CONTRADICTED"],
  ] as const)("records %s review without silently changing lifecycle", async (outcome, reasonCode) => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record());
    const result = await new KnowledgeRevalidationService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() })
      .revalidate(request({ outcome }));

    expect(result).toMatchObject({
      status: "REVIEW_FAILED", reasonCode, recommendedLifecycleState: "QUARANTINED", persistenceEffect: "CREATED",
    });
    expect((await repository.getById("knowledge-001"))?.lifecycleState).toBe("ACTIVE");
  });

  it("is idempotent by review ID and rejects conflicting reuse", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record());
    const service = new KnowledgeRevalidationService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() });
    await service.revalidate(request());

    const replay = await service.revalidate(request());
    const conflict = await service.revalidate(request({ outcome: "CONTRADICTED" }));
    expect(replay).toMatchObject({ status: "REVALIDATED", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(conflict).toMatchObject({ status: "REJECTED", reasonCode: "REVIEW_ID_CONFLICT" });
  });

  it("fails closed for absent evidence or failed review persistence", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record());
    const missingEvidence = await new KnowledgeRevalidationService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() })
      .revalidate(request({ evidenceIds: [] }));
    const failingRepository: KnowledgeReviewRepository = {
      create: (value) => repository.create(value), getById: (id) => repository.getById(id),
      findByCandidateId: (id) => repository.findByCandidateId(id), findReviewById: (id) => repository.findReviewById(id),
      findLatestReviewByKnowledgeId: (id) => repository.findLatestReviewByKnowledgeId(id),
      createReview: async () => { throw new Error("simulated persistence failure"); },
    };
    const persistenceFailure = await new KnowledgeRevalidationService({ repository: failingRepository, auditLedger: new InMemoryKnowledgeAuditLedger() })
      .revalidate(request({ reviewId: "review-002" }));

    expect(missingEvidence).toMatchObject({ status: "REJECTED", reasonCode: "EVIDENCE_MISSING" });
    expect(persistenceFailure).toMatchObject({ status: "PERSISTENCE_FAILED", persistenceEffect: "NONE" });
  });
});
