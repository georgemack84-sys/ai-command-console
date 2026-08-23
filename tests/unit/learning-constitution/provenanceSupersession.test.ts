import { describe, expect, it } from "vitest";

import { InMemoryProvenanceLedger, ProvenanceQueryService, ProvenanceSupersessionService } from "@/services/learning-constitution";
import type { DurableProvenancedKnowledge } from "@/types/learning-constitution";

const human = { actorId: "human:owner", actorType: "HUMAN" as const };
const scope = { type: "PROJECT", id: "axiom" } as const;
const knowledge = (id: string, statement: string): DurableProvenancedKnowledge => ({ id, recordType: "DURABLE_KNOWLEDGE", statement, classification: "PRINCIPLE", scope, authority: "HUMAN_DECISION", candidateId: `candidate:${id}`, approvalId: `approval:${id}`, evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
const seeded = async () => { const ledger = new InMemoryProvenanceLedger(); await ledger.append(knowledge("P-17", "Axiom is a bedside terminal.")); await ledger.append(knowledge("P-42", "Axiom is primarily a bedside AI terminal.")); return ledger; };

describe("provenance supersession", () => {
  it("creates successor history without rewriting prior durable knowledge", async () => {
    const ledger = await seeded();
    const result = await new ProvenanceSupersessionService({ ledger, createRelationshipId: (type) => `relationship:${type}` }).supersede({ priorKnowledgeId: "P-17", successorKnowledgeId: "P-42", reason: "Human correction", actor: human });
    const query = new ProvenanceQueryService(ledger);
    expect(result).toMatchObject({ status: "SUPERSEDED", predecessor: { id: "P-17", statement: "Axiom is a bedside terminal." }, successor: { id: "P-42" }, relationships: [{ type: "SUPERSEDES" }, { type: "SUPERSEDED_BY" }], authorityEffect: "UNCHANGED" });
    expect(await query.getKnowledgeState("P-17")).toEqual({ knowledgeId: "P-17", current: false, historicalStatus: "SUPERSEDED", predecessorIds: [], successorIds: ["P-42"] });
    expect(await query.getKnowledgeState("P-42")).toEqual({ knowledgeId: "P-42", current: true, historicalStatus: "ACTIVE", predecessorIds: ["P-17"], successorIds: [] });
    expect((await ledger.get("P-17") as DurableProvenancedKnowledge).status).toBe("ACTIVE");
  });

  it.each([
    ["missing reason", { reason: "" }, "REASON_MISSING"],
    ["non-human actor", { actor: { actorId: "agent:noesis", actorType: "AGENT" as const } }, "ACTOR_NOT_HUMAN"],
    ["incompatible scope", { successorKnowledgeId: "P-other" }, "SCOPE_INCOMPATIBLE"],
  ])("rejects %s", async (_description, overrides, reasonCode) => {
    const ledger = await seeded();
    if ("successorKnowledgeId" in overrides && overrides.successorKnowledgeId === "P-other") await ledger.append({ ...knowledge("P-other", "elsewhere"), scope: { type: "PROJECT", id: "other" } });
    const result = await new ProvenanceSupersessionService({ ledger }).supersede({ priorKnowledgeId: "P-17", successorKnowledgeId: "P-42", reason: "correction", actor: human, ...overrides });
    expect(result).toMatchObject({ status: "REJECTED", reasonCode, persistenceEffect: "NONE" });
  });
});
