import { describe, expect, it } from "vitest";

import { CandidateKnowledgeService, EvidenceSetService, ExtractionService, HumanApprovalService, InMemoryProvenanceLedger, TeachingEventCaptureService } from "@/services/learning-constitution";
import { NOESIS_IDENTITY } from "@/types/learning-constitution";

const human = { actorId: "human:owner", actorType: "HUMAN" as const };
const noesis = { actorId: NOESIS_IDENTITY.systemId, actorType: "AGENT" as const };
const scope = { type: "PROJECT", id: "axiom" } as const;
const seeded = async () => {
  const ledger = new InMemoryProvenanceLedger();
  await new TeachingEventCaptureService({ ledger, createId: () => "TE-218" }).capture({ sourceType: "CONVERSATION", sourceActor: human, originalContent: "Keep Axiom primarily as a bedside terminal.", scopeHint: scope });
  await new ExtractionService({ ledger, createId: () => "EX-401" }).extract({ sourceRefs: ["TE-218"], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "Axiom is primarily a bedside terminal.", confidence: 0.96 });
  await new CandidateKnowledgeService({ ledger, createId: () => "CP-29" }).propose({ statement: "Axiom should remain primarily a bedside terminal.", classification: "PRINCIPLE", scope, authority: "HUMAN_PREFERENCE", extractionRefs: ["EX-401"] });
  return ledger;
};

describe("approval and evidence provenance", () => {
  it("records evidence and a human approval independently from candidate knowledge", async () => {
    const ledger = await seeded();
    const evidence = await new EvidenceSetService({ ledger, createId: () => "ES-17" }).create({ evidenceRefs: ["TE-218"], collectedBy: noesis });
    const approval = await new HumanApprovalService({ ledger, createId: () => "HA-88", createRelationshipId: () => "candidate-approved" }).decide({ candidateId: "CP-29", decision: "APPROVED", actor: human, approvedStatement: "Axiom should remain primarily a bedside terminal." });
    expect(evidence).toMatchObject({ status: "CREATED", evidenceSet: { id: "ES-17", evidenceRefs: ["TE-218"], immutable: true }, authorityEffect: "UNCHANGED" });
    expect(approval).toMatchObject({ status: "RECORDED", approval: { id: "HA-88", candidateId: "CP-29", decision: "APPROVED", immutable: true }, relationship: { type: "APPROVED_BY", fromId: "CP-29", toId: "HA-88" }, executionPermissionGranted: false });
    expect((await ledger.get("CP-29"))?.recordType).toBe("CANDIDATE_KNOWLEDGE");
  });

  it.each([
    ["missing evidence", { evidenceRefs: [] }, "EVIDENCE_MISSING"],
    ["unknown evidence", { evidenceRefs: ["missing"] }, "EVIDENCE_MISSING"],
  ])("rejects %s evidence sets", async (_description, input, reasonCode) => {
    const result = await new EvidenceSetService({ ledger: await seeded() }).create({ collectedBy: noesis, ...input });
    expect(result).toMatchObject({ status: "REJECTED", reasonCode, persistenceEffect: "NONE" });
  });

  it.each([
    ["missing candidate", { candidateId: "missing", actor: human, approvedStatement: "statement" }, "CANDIDATE_MISSING"],
    ["non-human actor", { candidateId: "CP-29", actor: noesis, approvedStatement: "statement" }, "ACTOR_NOT_HUMAN"],
    ["missing approval statement", { candidateId: "CP-29", actor: human, approvedStatement: "" }, "APPROVED_STATEMENT_MISSING"],
  ])("rejects %s approval", async (_description, input, reasonCode) => {
    const result = await new HumanApprovalService({ ledger: await seeded() }).decide({ decision: "APPROVED", ...input });
    expect(result).toMatchObject({ status: "REJECTED", reasonCode, persistenceEffect: "NONE" });
  });
});
