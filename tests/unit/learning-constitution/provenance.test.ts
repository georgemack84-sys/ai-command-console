import { describe, expect, it } from "vitest";

import { InMemoryProvenanceLedger, ProvenanceQueryService, validateProvenance } from "@/services/learning-constitution";
import { NOESIS_IDENTITY, NOESIS_IDENTITY_MIGRATION, type ProvenanceActor, type ProvenanceRelationship } from "@/types/learning-constitution";

const human: ProvenanceActor = { actorId: "human:owner", actorType: "HUMAN" };
const noesis: ProvenanceActor = { actorId: NOESIS_IDENTITY.systemId, actorType: "AGENT" };
const scope = { type: "PROJECT", id: "axiom" } as const;
const relationship = (id: string, fromId: string, toId: string, type: ProvenanceRelationship["type"]): ProvenanceRelationship => ({ id, fromId, toId, type, createdAt: "2026-08-23T00:00:00.000Z", actor: noesis, immutable: true });

describe("Noesis provenance ledger", () => {
  it("reconstructs a durable principle through approval, interpretation, and immutable original teaching", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "TE-218", recordType: "TEACHING_EVENT", sourceType: "CONVERSATION", sourceActor: human, originalContent: "Keep Axiom primarily as a bedside terminal.", receivedAt: "2026-08-20T00:00:00.000Z", scopeHint: scope, immutable: true });
    await ledger.append({ id: "EX-401", recordType: "EXTRACTION", sourceRefs: ["TE-218"], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "Axiom's primary role is a bedside AI terminal.", confidence: 0.96, createdAt: "2026-08-20T00:01:00.000Z", immutable: true });
    await ledger.append({ id: "CP-29", recordType: "CANDIDATE_KNOWLEDGE", statement: "Axiom should remain primarily a bedside terminal.", classification: "PRINCIPLE", scope, authority: "HUMAN_PREFERENCE", extractionRefs: ["EX-401"], evidenceRefs: ["TE-218"], status: "APPROVED", createdAt: "2026-08-20T00:02:00.000Z", immutable: true });
    await ledger.append({ id: "HA-88", recordType: "HUMAN_APPROVAL", candidateId: "CP-29", decision: "APPROVED", actor: human, approvedStatement: "Axiom should remain primarily a bedside terminal.", decidedAt: "2026-08-20T00:03:00.000Z", immutable: true });
    await ledger.append({ id: "P-17", recordType: "DURABLE_KNOWLEDGE", statement: "Axiom should remain primarily a bedside terminal.", classification: "PRINCIPLE", scope, authority: "HUMAN_PREFERENCE", candidateId: "CP-29", approvalId: "HA-88", evidenceRefs: ["TE-218"], status: "ACTIVE", createdAt: "2026-08-20T00:04:00.000Z", immutable: true });
    for (const item of [relationship("r1", "EX-401", "TE-218", "EXTRACTED_FROM"), relationship("r2", "CP-29", "EX-401", "DERIVED_FROM"), relationship("r3", "P-17", "CP-29", "DERIVED_FROM"), relationship("r4", "P-17", "HA-88", "APPROVED_BY")]) await ledger.relate(item);

    const query = new ProvenanceQueryService(ledger);
    const explanation = await query.explainKnowledge("P-17");
    expect(NOESIS_IDENTITY).toMatchObject({ systemId: "agent:noesis", systemName: "Noesis", systemType: "LEARNING_AGENT" });
    expect(NOESIS_IDENTITY_MIGRATION).toMatchObject({ from: "Learning Agent", to: "Noesis", immutable: true });
    expect(explanation.integrity).toEqual({ valid: true, violations: [] });
    expect((await query.getOriginalSource("P-17")).map((item) => item.id)).toEqual(["TE-218"]);
    expect((await query.getApprovals("P-17")).map((item) => item.id)).toEqual(["HA-88"]);
    expect(explanation.lineage.map((item) => item.id)).toEqual(["P-17", "CP-29", "EX-401", "TE-218", "HA-88"]);
    const userFacingExplanation = await query.explain("P-17");
    expect(userFacingExplanation).toMatchObject({
      knowledgeId: "P-17",
      originalSources: [{ id: "TE-218", originalContent: "Keep Axiom primarily as a bedside terminal." }],
      interpretations: [{ id: "EX-401" }],
      approvals: [{ id: "HA-88", actor: human }],
      evidence: [{ id: "TE-218" }],
      history: [{ id: "TE-218" }, { id: "EX-401" }, { id: "CP-29" }, { id: "HA-88" }, { id: "P-17" }],
      integrity: { valid: true },
    });
  });

  it("rejects rewritten history and identifies incomplete durable provenance", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append({ id: "P-orphan", recordType: "DURABLE_KNOWLEDGE", statement: "Untraceable", classification: "PRINCIPLE", scope, authority: "", candidateId: "missing-candidate", approvalId: "missing-approval", evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await expect(ledger.append({ id: "P-orphan", recordType: "DURABLE_KNOWLEDGE", statement: "Rewritten", classification: "PRINCIPLE", scope, authority: "", candidateId: "missing-candidate", approvalId: "missing-approval", evidenceRefs: [], status: "ACTIVE", createdAt: "2026-08-23T00:00:00.000Z", immutable: true })).rejects.toThrow("cannot be rewritten");
    expect((await validateProvenance(ledger, "P-orphan")).violations).toEqual(["INVALID_AUTHORITY", "MISSING_APPROVAL", "MISSING_INTERPRETATION"]);
  });
});
