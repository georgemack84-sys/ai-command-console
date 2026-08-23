import { describe, expect, it } from "vitest";

import {
  InMemoryKnowledgeAuditLedger,
  InMemoryKnowledgeRepository,
  KnowledgeRetirementService,
  KnowledgeRetrievalService,
} from "@/services/learning-constitution";
import type { DurableKnowledgeRecord, KnowledgeLifecycleRepository } from "@/types/learning-constitution";

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
  },
  policyVersion: "1.0.0", constitutionVersion: "1.0.0", ...overrides,
});

describe("knowledge retirement", () => {
  it.each([
    ["ARCHIVED", "KNOWLEDGE_ARCHIVED"],
    ["QUARANTINED", "KNOWLEDGE_QUARANTINED"],
  ] as const)("transitions active knowledge to %s with an immutable audit event", async (targetLifecycleState, reasonCode) => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await repository.create(record());
    const result = await new KnowledgeRetirementService({ repository, auditLedger: ledger }).transition({
      knowledgeId: "knowledge-001", targetLifecycleState, reason: "No longer suitable for normal applicability.",
    });

    expect(result).toMatchObject({
      status: "TRANSITIONED", reasonCode, created: true, persistenceEffect: "UPDATED",
      authorityEffect: "UNCHANGED", executionPermissionGranted: false,
      priorRecord: { lifecycleState: "ACTIVE", content: "Use PostgreSQL." },
      updatedRecord: { lifecycleState: targetLifecycleState, content: "Use PostgreSQL." },
      auditEvent: { eventType: reasonCode, newLifecycleState: targetLifecycleState },
    });
    expect(await ledger.findByKnowledgeId("knowledge-001")).toHaveLength(1);
    expect((await new KnowledgeRetrievalService({ repository }).retrieve({ scope, knowledgeId: "knowledge-001" })))
      .toMatchObject({ status: "NOT_FOUND", reasonCode: "KNOWLEDGE_NOT_ACTIVE" });
  });

  it("is idempotent only for the same completed state", async () => {
    const repository = new InMemoryKnowledgeRepository();
    const ledger = new InMemoryKnowledgeAuditLedger();
    await repository.create(record());
    const service = new KnowledgeRetirementService({ repository, auditLedger: ledger });
    await service.transition({ knowledgeId: "knowledge-001", targetLifecycleState: "ARCHIVED", reason: "retired" });

    const replay = await service.transition({ knowledgeId: "knowledge-001", targetLifecycleState: "ARCHIVED", reason: "retired" });
    const invalidTransition = await service.transition({ knowledgeId: "knowledge-001", targetLifecycleState: "QUARANTINED", reason: "late concern" });

    expect(replay).toMatchObject({ status: "TRANSITIONED", reasonCode: "IDEMPOTENT_REPLAY", created: false });
    expect(invalidTransition).toMatchObject({ status: "REJECTED", reasonCode: "KNOWLEDGE_NOT_ACTIVE" });
    expect(await ledger.findByKnowledgeId("knowledge-001")).toHaveLength(1);
  });

  it("rejects missing reasons and incomplete lineage before mutation", async () => {
    const repository = new InMemoryKnowledgeRepository();
    await repository.create(record());
    const service = new KnowledgeRetirementService({ repository, auditLedger: new InMemoryKnowledgeAuditLedger() });

    const missingReason = await service.transition({ knowledgeId: "knowledge-001", targetLifecycleState: "ARCHIVED", reason: " " });
    const incompleteRecord = new InMemoryKnowledgeRepository();
    await incompleteRecord.create(record({ policyVersion: "" }));
    const incompleteLineage = await new KnowledgeRetirementService({ repository: incompleteRecord, auditLedger: new InMemoryKnowledgeAuditLedger() })
      .transition({ knowledgeId: "knowledge-001", targetLifecycleState: "ARCHIVED", reason: "retired" });

    expect(missingReason).toMatchObject({ status: "REJECTED", reasonCode: "RETIREMENT_REASON_MISSING" });
    expect(incompleteLineage).toMatchObject({ status: "REJECTED", reasonCode: "LINEAGE_INCONSISTENT" });
    expect((await repository.getById("knowledge-001"))?.lifecycleState).toBe("ACTIVE");
  });

  it("fails closed when the transition cannot persist", async () => {
    const backing = new InMemoryKnowledgeRepository();
    await backing.create(record());
    const failingRepository: KnowledgeLifecycleRepository = {
      create: (value) => backing.create(value), getById: (id) => backing.getById(id),
      findByCandidateId: (id) => backing.findByCandidateId(id), supersede: (value) => backing.supersede(value),
      findSupersessionByReplacementId: (id) => backing.findSupersessionByReplacementId(id),
      registerException: (value) => backing.registerException(value),
      findExceptionByKnowledgeId: (id) => backing.findExceptionByKnowledgeId(id),
      transitionLifecycle: async () => { throw new Error("simulated persistence failure"); },
    };
    const result = await new KnowledgeRetirementService({ repository: failingRepository, auditLedger: new InMemoryKnowledgeAuditLedger() })
      .transition({ knowledgeId: "knowledge-001", targetLifecycleState: "QUARANTINED", reason: "suspect evidence" });

    expect(result).toMatchObject({ status: "PERSISTENCE_FAILED", persistenceEffect: "NONE" });
    expect((await backing.getById("knowledge-001"))?.lifecycleState).toBe("ACTIVE");
  });
});
