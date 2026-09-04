import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeExplanationService,
  KnowledgeFreshnessService,
} from "@/services/learning-constitution";
import type { DurableKnowledgeRecord } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-01T00:00:00.000Z",
};
const alphaScope = { type: "PROJECT", id: "project-alpha" } as const;
const betaScope = { type: "PROJECT", id: "project-beta" } as const;
const record = (id: string, overrides: Partial<DurableKnowledgeRecord> = {}): DurableKnowledgeRecord => ({
  knowledgeId: id, candidateId: `candidate-${id}`, content: "Use PostgreSQL.", classification: "PROJECT_DECISION",
  scope: alphaScope, lifecycleState: "ACTIVE", createdAt: "2026-08-01T00:00:00.000Z", effectiveFrom: "2026-08-01T00:00:00.000Z", provenance,
  lineage: { candidateId: `candidate-${id}`, observationId: provenance.observationId, classificationRationaleCode: "TEST", scopeRationaleCode: "TEST", conflictRelationship: "UNRELATED", validationOutcome: "VALID", decisionReasonCode: "ACCEPTED_FOR_ADMISSION" },
  policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});

describe("knowledge explanation", () => {
  it("returns deterministically ordered provenance, review, exception, and freshness history", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await repository.create(record("knowledge-base"));
    await repository.create(record("knowledge-exception", { classification: "EXCEPTION", lineage: { ...record("x").lineage, conflictRelationship: "CREATES_EXCEPTION" } }));
    await repository.registerException({
      baseKnowledgeId: "knowledge-base", exceptionKnowledgeId: "knowledge-exception",
      relationship: { exceptionId: "exception-001", baseKnowledgeId: "knowledge-base", exceptionKnowledgeId: "knowledge-exception", applicabilityCondition: "incident", reason: "test", occurredAt: "2026-08-02T00:00:00.000Z", provenance, policyVersion: "1.0.0", constitutionVersion: "1.0.0" },
    });
    await repository.createReview({ reviewId: "review-001", knowledgeId: "knowledge-base", outcome: "CONFIRMED", evidenceIds: ["evidence-001"], reviewerId: "reviewer-001", reviewedAt: "2026-08-03T00:00:00.000Z", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance });
    await ledger.append({ eventId: "audit-z", eventType: "KNOWLEDGE_REVALIDATED", reviewId: "review-001", knowledgeId: "knowledge-base", outcome: "CONFIRMED", occurredAt: "2026-08-03T00:00:00.000Z", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance });
    await ledger.append({ eventId: "audit-a", eventType: "KNOWLEDGE_ADMITTED", knowledgeId: "knowledge-base", candidateId: "candidate-knowledge-base", occurredAt: "2026-08-01T00:00:00.000Z", decisionReasonCode: "ACCEPTED_FOR_ADMISSION", policyVersion: "1.0.0", constitutionVersion: "1.0.0", provenance });
    const freshness = new KnowledgeFreshnessService({ policies: [{ policyId: "review-policy", classification: "PROJECT_DECISION", reviewIntervalDays: 30, overdueGraceDays: 0, policyVersion: "1.0.0" }], now: () => "2026-08-15T00:00:00.000Z" });

    const result = await new KnowledgeExplanationService({ repository, auditLedger: ledger, freshnessEvaluator: freshness }).explain({ knowledgeId: "knowledge-base", scope: alphaScope });
    expect(result).toMatchObject({ status: "COMPLETE", reasonCode: "KNOWLEDGE_HISTORY_EXPLAINED", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(result.trace?.auditEvents.map((event) => event.eventId)).toEqual(["audit-a", "audit-z"]);
    expect(result.trace).toMatchObject({ latestReview: { reviewId: "review-001" }, freshness: { status: "CURRENT" } });
    expect(result.trace?.exceptionsToThisKnowledge).toHaveLength(1);
  });

  it("reports not found, out-of-scope, and incomplete history without mutation", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const service = new KnowledgeExplanationService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() });
    const missing = await service.explain({ knowledgeId: "missing" });
    await repository.create(record("knowledge-without-audit"));
    const outOfScope = await service.explain({ knowledgeId: "knowledge-without-audit", scope: betaScope });
    const incomplete = await service.explain({ knowledgeId: "knowledge-without-audit", scope: alphaScope });
    expect(missing).toMatchObject({ status: "NOT_FOUND" });
    expect(outOfScope).toMatchObject({ status: "OUT_OF_SCOPE" });
    expect(incomplete).toMatchObject({ status: "INCOMPLETE_HISTORY", reasonCode: "ADMISSION_HISTORY_MISSING" });
  });
});
