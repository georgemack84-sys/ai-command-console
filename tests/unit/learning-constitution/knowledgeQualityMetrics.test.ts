import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  InMemoryKnowledgeReviewWorkQueue,
  KnowledgeQualityMetricsService,
} from "@/services/learning-constitution";
import type { DurableKnowledgeRecord, KnowledgeFreshnessAssessment, KnowledgeScopeReference } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-01T00:00:00.000Z",
};
const alphaScope = { type: "PROJECT", id: "project-alpha" } as const;
const betaScope = { type: "PROJECT", id: "project-beta" } as const;
const record = (id: string, scope: KnowledgeScopeReference = alphaScope, overrides: Partial<DurableKnowledgeRecord> = {}): DurableKnowledgeRecord => ({
  knowledgeId: id, candidateId: `candidate-${id}`, content: "Use PostgreSQL.", classification: "PROJECT_DECISION",
  scope, lifecycleState: "ACTIVE", createdAt: "2026-08-01T00:00:00.000Z", effectiveFrom: "2026-08-01T00:00:00.000Z", provenance,
  lineage: {
    candidateId: `candidate-${id}`, observationId: provenance.observationId, classificationRationaleCode: "TEST",
    scopeRationaleCode: "TEST", conflictRelationship: "UNRELATED", validationOutcome: "VALID",
    decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
  }, policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});
const overdueFreshness = (knowledgeId: string): KnowledgeFreshnessAssessment => ({
  knowledgeId, status: "OVERDUE", reasonCode: "REVIEW_OVERDUE_BY_POLICY", basisTimestamp: "2026-08-01T00:00:00.000Z",
  reviewDueAt: "2026-08-31T00:00:00.000Z", selectedPolicyId: "policy-001", selectedPolicyVersion: "1.0.0",
  recommendedAction: "REVIEW_FOR_QUARANTINE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

const setup = async () => {
  const repository = new InMemoryKnowledgeRepository();
  const ledger = new InMemoryKnowledgeAuditLedger();
  const queue = new InMemoryKnowledgeReviewWorkQueue();
  await repository.create(record("alpha-active"));
  await repository.create(record("alpha-archived", alphaScope, { lifecycleState: "ARCHIVED", policyVersion: "" }));
  await repository.create(record("beta-active", betaScope));
  await ledger.append({
    eventId: "audit-alpha-admitted", eventType: "KNOWLEDGE_ADMITTED", knowledgeId: "alpha-active", candidateId: "candidate-alpha-active",
    occurredAt: "2026-08-02T00:00:00.000Z", decisionReasonCode: "ACCEPTED_FOR_ADMISSION", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance,
  });
  await ledger.append({
    eventId: "audit-alpha-review", eventType: "KNOWLEDGE_REVIEW_FAILED", reviewId: "review-alpha", knowledgeId: "alpha-active", outcome: "UNVERIFIABLE",
    occurredAt: "2026-09-02T00:00:00.000Z", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance,
  });
  await ledger.append({
    eventId: "audit-beta-admitted", eventType: "KNOWLEDGE_ADMITTED", knowledgeId: "beta-active", candidateId: "candidate-beta-active",
    occurredAt: "2026-08-02T00:00:00.000Z", decisionReasonCode: "ACCEPTED_FOR_ADMISSION", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance,
  });
  await queue.create({
    workItemId: "work-alpha", knowledgeId: "alpha-active", state: "QUEUED", priority: "HIGH", freshness: overdueFreshness("alpha-active"),
    createdAt: "2026-09-02T00:00:00.000Z", policyVersion: "1.0.0", constitutionVersion: "1.0.0",
  });
  return new KnowledgeQualityMetricsService({
    knowledgeRepository: repository, auditEvents: () => ledger.findAll(), reviewWorkItems: () => queue.findAll(),
    now: () => "2026-09-03T00:00:00.000Z",
  });
};

describe("knowledge quality metrics", () => {
  it("aggregates scoped lifecycle, audit, review, and queue metrics without side effects", async () => {
    const report = await (await setup()).report({ scope: alphaScope, maxOverdueWorkItems: 0 });
    expect(report).toMatchObject({
      status: "COMPLETE", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
      metrics: {
        totalKnowledgeRecords: 2, activeKnowledgeRecords: 1, archivedKnowledgeRecords: 1,
        admittedEvents: 1, reviewFailedEvents: 1, queuedReviewWorkItems: 1, overdueQueuedReviewWorkItems: 1,
        recordsMissingVersion: 1,
      },
      sourceCounts: { knowledgeRecords: 2, auditEvents: 2, reviewWorkItems: 1 },
    });
    expect(report.alerts).toContainEqual(expect.objectContaining({ code: "OVERDUE_REVIEW_BACKLOG_EXCEEDED" }));
  });

  it("isolates scope and reports insufficient data rather than inventing a trend", async () => {
    const service = await setup();
    const beta = await service.report({ scope: betaScope });
    const empty = await service.report({ scope: { type: "PROJECT", id: "project-empty" } });
    expect(beta.metrics).toMatchObject({ totalKnowledgeRecords: 1, admittedEvents: 1, queuedReviewWorkItems: 0 });
    expect(empty).toMatchObject({ status: "INSUFFICIENT_DATA", metrics: { totalKnowledgeRecords: 0 } });
    expect(empty.alerts).toContainEqual(expect.objectContaining({ code: "INSUFFICIENT_DATA" }));
  });
});
