import { describe, expect, it } from "vitest";

import { InMemoryProvenanceLedger, PromotionConflictAnalysisService } from "@/services/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;

describe("PromotionConflictAnalysisService", () => {
  it("records an immutable uncertainty conflict before promotion can continue", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "CP-1", recordType: "CANDIDATE_KNOWLEDGE", statement: "Use SQLite.", classification: "PRINCIPLE", scope, authority: "HUMAN", extractionRefs: [], evidenceRefs: [], status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "P-1", recordType: "DURABLE_KNOWLEDGE", statement: "Use PostgreSQL.", classification: "PRINCIPLE", scope, authority: "HUMAN", candidateId: "CP-existing", approvalId: "HA-existing", evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    const result = await new PromotionConflictAnalysisService(ledger).analyze("CP-1", { actorId: "user:owner", actorType: "HUMAN" });
    expect(result).toMatchObject({ status: "ANALYZED", searchedKnowledgeIds: ["P-1"], persistenceEffect: "CREATED" });
    expect((await ledger.getAll()).some((record) => record.recordType === "CONFLICT" && record.candidateKnowledgeId === "CP-1" && record.existingKnowledgeId === "P-1" && record.type === "AMBIGUOUS_CONFLICT")).toBe(true);
  });

  it("does not create duplicate conflict records on re-analysis", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "CP-2", recordType: "CANDIDATE_KNOWLEDGE", statement: "Use SQLite.", classification: "PRINCIPLE", scope, authority: "HUMAN", extractionRefs: [], evidenceRefs: [], status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "P-2", recordType: "DURABLE_KNOWLEDGE", statement: "Use PostgreSQL.", classification: "PRINCIPLE", scope, authority: "HUMAN", candidateId: "CP-existing", approvalId: "HA-existing", evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    const service = new PromotionConflictAnalysisService(ledger); await service.analyze("CP-2", { actorId: "user:owner", actorType: "HUMAN" }); await service.analyze("CP-2", { actorId: "user:owner", actorType: "HUMAN" });
    expect((await ledger.getAll()).filter((record) => record.recordType === "CONFLICT" && record.candidateKnowledgeId === "CP-2" && record.existingKnowledgeId === "P-2")).toHaveLength(1);
  });
});
