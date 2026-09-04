import { describe, expect, it } from "vitest";

import { assessProvenancePhaseExit, InMemoryProvenanceLedger, provenanceTrustState, validateProvenance } from "@/services/learning-constitution";
import type { DurableProvenancedKnowledge } from "@/types/learning-constitution";

const human = { actorId: "human:owner", actorType: "HUMAN" as const };
const noesis = { actorId: "agent:noesis", actorType: "AGENT" as const };
const scope = { type: "PROJECT", id: "axiom" } as const;
const durable = (id: string): DurableProvenancedKnowledge => ({ id, recordType: "DURABLE_KNOWLEDGE", statement: "Axiom should remain a bedside terminal.", classification: "PRINCIPLE", scope, authority: "HUMAN_DECISION", candidateId: `CP-${id}`, approvalId: `HA-${id}`, evidenceRefs: ["TE-1"], status: "ACTIVE", createdAt: "2026-08-23T00:04:00.000Z", immutable: true });

const completeLedger = async () => {
  const ledger = new InMemoryProvenanceLedger();
  await ledger.append({ id: "TE-1", recordType: "TEACHING_EVENT", sourceType: "CONVERSATION", sourceActor: human, originalContent: "Keep it bedside.", receivedAt: "2026-08-23T00:00:00.000Z", scopeHint: scope, immutable: true });
  await ledger.append({ id: "EX-1", recordType: "EXTRACTION", sourceRefs: ["TE-1"], interpretedBy: noesis, classification: "PRINCIPLE", scope, interpretation: "bedside terminal", confidence: 0.9, createdAt: "2026-08-23T00:01:00.000Z", immutable: true });
  await ledger.append({ id: "CP-P-1", recordType: "CANDIDATE_KNOWLEDGE", statement: "Axiom should remain a bedside terminal.", classification: "PRINCIPLE", scope, authority: "HUMAN_DECISION", extractionRefs: ["EX-1"], evidenceRefs: ["TE-1"], status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:02:00.000Z", immutable: true });
  await ledger.append({ id: "HA-P-1", recordType: "HUMAN_APPROVAL", candidateId: "CP-P-1", decision: "APPROVED", actor: human, approvedStatement: "Axiom should remain a bedside terminal.", decidedAt: "2026-08-23T00:03:00.000Z", immutable: true });
  await ledger.append({ ...durable("P-1"), candidateId: "CP-P-1", approvalId: "HA-P-1" });
  return ledger;
};

describe("provenance integrity and Phase 7 exit", () => {
  it("marks a complete durable chain as trusted and passes the exit gate", async () => {
    const ledger = await completeLedger();
    expect(await validateProvenance(ledger, "P-1")).toEqual({ valid: true, violations: [] });
    expect(provenanceTrustState(await validateProvenance(ledger, "P-1"))).toBe("TRUSTED");
    expect(await assessProvenancePhaseExit(ledger)).toMatchObject({ phase: "PHASE_7", passed: true, durableKnowledgeCount: 1, trustedKnowledgeCount: 1, assessments: [{ knowledgeId: "P-1", trustState: "TRUSTED" }] });
  });

  it("fails closed and never labels incomplete provenance trusted", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append(durable("P-orphan"));
    const integrity = await validateProvenance(ledger, "P-orphan");
    expect(integrity.violations).toEqual(["MISSING_APPROVAL", "MISSING_INTERPRETATION", "MISSING_REQUIRED_EVIDENCE"]);
    expect(provenanceTrustState(integrity)).toBe("QUARANTINED");
    expect(await assessProvenancePhaseExit(ledger)).toMatchObject({ passed: false, trustedKnowledgeCount: 0, assessments: [{ trustState: "QUARANTINED" }] });
  });

  it("detects unknown actors and broken scope lineage", async () => {
    const ledger = await completeLedger();
    await ledger.append({ id: "TE-2", recordType: "TEACHING_EVENT", sourceType: "CONVERSATION", sourceActor: { actorId: "", actorType: "HUMAN" }, originalContent: "bad", receivedAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "EX-2", recordType: "EXTRACTION", sourceRefs: ["TE-2"], interpretedBy: noesis, classification: "PRINCIPLE", scope: { type: "PROJECT", id: "other" }, interpretation: "bad", confidence: 0.9, createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "CP-P-2", recordType: "CANDIDATE_KNOWLEDGE", statement: "bad", classification: "PRINCIPLE", scope: { type: "PROJECT", id: "other" }, authority: "HUMAN_DECISION", extractionRefs: ["EX-2"], evidenceRefs: [], status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ id: "HA-P-2", recordType: "HUMAN_APPROVAL", candidateId: "CP-P-2", decision: "APPROVED", actor: human, approvedStatement: "bad", decidedAt: "2026-08-23T00:00:00.000Z", immutable: true });
    await ledger.append({ ...durable("P-2"), candidateId: "CP-P-2", approvalId: "HA-P-2", evidenceRefs: [] });
    expect((await validateProvenance(ledger, "P-2")).violations).toEqual(["BROKEN_LINEAGE", "UNKNOWN_ACTOR"]);
  });
});
