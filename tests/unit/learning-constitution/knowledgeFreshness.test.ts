import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeRepository,
  KnowledgeFreshnessService,
  KnowledgeRetrievalService,
} from "@/services/learning-constitution";
import type { DurableKnowledgeRecord, KnowledgeReviewPolicy } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "interaction-001", sourceType: "OPERATOR_STATEMENT" as const,
  originatingActorId: "operator-001", observedAt: "2026-08-01T00:00:00.000Z",
};
const alphaScope = { type: "PROJECT", id: "project-alpha" } as const;
const betaScope = { type: "PROJECT", id: "project-beta" } as const;
const record = (overrides: Partial<DurableKnowledgeRecord> = {}): DurableKnowledgeRecord => ({
  knowledgeId: "knowledge-001", candidateId: "candidate-001", content: "Use PostgreSQL.", classification: "PROJECT_DECISION",
  scope: alphaScope, lifecycleState: "ACTIVE", createdAt: provenance.observedAt, effectiveFrom: provenance.observedAt, provenance,
  lineage: {
    candidateId: "candidate-001", observationId: provenance.observationId, classificationRationaleCode: "TEST",
    scopeRationaleCode: "TEST", conflictRelationship: "UNRELATED", validationOutcome: "VALID",
    decisionReasonCode: "ACCEPTED_FOR_ADMISSION",
  }, policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});

const policy = (overrides: Partial<KnowledgeReviewPolicy> = {}): KnowledgeReviewPolicy => ({
  policyId: "project-decision-30-day", classification: "PROJECT_DECISION", reviewIntervalDays: 30,
  overdueGraceDays: 10, policyVersion: "1.0.0", ...overrides,
});

describe("knowledge freshness", () => {
  it.each([
    ["2026-08-15T00:00:00.000Z", "CURRENT", "NONE"],
    ["2026-08-31T00:00:00.000Z", "REVIEW_DUE", "REVALIDATE"],
    ["2026-09-10T00:00:00.000Z", "OVERDUE", "REVIEW_FOR_QUARANTINE"],
  ] as const)("assesses %s as %s", (now, status, recommendedAction) => {
    const service = new KnowledgeFreshnessService({ policies: [policy()], now: () => now });
    expect(service.assess(record())).toMatchObject({ status, recommendedAction });
  });

  it("uses a latest review as the freshness basis and supports scoped policy precedence", () => {
    const service = new KnowledgeFreshnessService({
      policies: [policy(), policy({ policyId: "alpha-fast", scope: alphaScope, reviewIntervalDays: 5 })],
      now: () => "2026-08-20T00:00:00.000Z",
    });
    const assessment = service.assess(record(), {
      reviewId: "review-001", knowledgeId: "knowledge-001", outcome: "CONFIRMED", evidenceIds: ["evidence-001"],
      reviewerId: "reviewer-001", reviewedAt: "2026-08-18T00:00:00.000Z", policyVersion: "1.0.0",
      constitutionVersion: "1.0.0", provenance,
    });
    expect(assessment).toMatchObject({ status: "CURRENT", selectedPolicyId: "alpha-fast", latestReviewId: "review-001" });
  });

  it("fails closed for missing, ambiguous, or invalid policy", () => {
    const noPolicy = new KnowledgeFreshnessService({ policies: [] }).assess(record());
    const ambiguous = new KnowledgeFreshnessService({ policies: [policy(), policy({ policyId: "duplicate" })] }).assess(record());
    const invalid = new KnowledgeFreshnessService({ policies: [policy({ reviewIntervalDays: 0 })] }).assess(record());
    expect(noPolicy).toMatchObject({ status: "NO_REVIEW_POLICY", recommendedAction: "NONE" });
    expect(ambiguous).toMatchObject({ status: "INVALID_POLICY", recommendedAction: "NONE" });
    expect(invalid).toMatchObject({ status: "INVALID_POLICY", recommendedAction: "NONE" });
  });

  it("surfaces the configured freshness assessment through retrieval without altering scope isolation", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record());
    const evaluator = new KnowledgeFreshnessService({ policies: [policy()], now: () => "2026-08-31T00:00:00.000Z" });
    const service = new KnowledgeRetrievalService({ repository, freshnessEvaluator: evaluator });

    const matching = await service.retrieve({ scope: alphaScope, knowledgeId: "knowledge-001" });
    const outOfScope = await service.retrieve({ scope: betaScope, knowledgeId: "knowledge-001" });
    expect(matching.freshness).toMatchObject({ status: "REVIEW_DUE", recommendedAction: "REVALIDATE" });
    expect(outOfScope).toMatchObject({ status: "OUT_OF_SCOPE" });
    expect(outOfScope.freshness).toBeUndefined();
  });
});
