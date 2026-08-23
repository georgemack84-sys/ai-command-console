import { describe, expect, it } from "vitest";

import { CandidateKnowledgeService, ExtractionService, InMemoryProvenanceLedger, TeachingEventCaptureService } from "@/services/learning-constitution";
import { NOESIS_IDENTITY } from "@/types/learning-constitution";

const human = { actorId: "human:owner", actorType: "HUMAN" as const };
const noesis = { actorId: NOESIS_IDENTITY.systemId, actorType: "AGENT" as const };
const scope = { type: "PROJECT", id: "axiom" } as const;

const withExtraction = async () => {
  const ledger = new InMemoryProvenanceLedger();
  await new TeachingEventCaptureService({ ledger, createId: () => "TE-218" }).capture({ sourceType: "CONVERSATION", sourceActor: human, originalContent: "Keep Axiom primarily as a bedside terminal.", scopeHint: scope });
  await new ExtractionService({ ledger, createId: () => "EX-401", createRelationshipId: () => "extraction-source" }).extract({ sourceRefs: ["TE-218"], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "Axiom's primary role is a bedside AI terminal.", confidence: 0.96 });
  return ledger;
};

describe("Candidate knowledge lineage", () => {
  it("creates a non-durable candidate derived from its extraction", async () => {
    const ledger = await withExtraction();
    const result = await new CandidateKnowledgeService({ ledger, createId: () => "CP-29", createRelationshipId: () => "candidate-extraction", now: () => "2026-08-23T00:02:00.000Z" }).propose({ statement: "Axiom should remain primarily a bedside terminal.", classification: "PRINCIPLE", scope, authority: "HUMAN_PREFERENCE", extractionRefs: ["EX-401"], evidenceRefs: ["TE-218"] });

    expect(result).toMatchObject({ status: "CREATED", reasonCode: "CANDIDATE_KNOWLEDGE_CREATED", candidate: { id: "CP-29", status: "AWAITING_APPROVAL", extractionRefs: ["EX-401"], immutable: true }, relationships: [{ fromId: "CP-29", toId: "EX-401", type: "DERIVED_FROM" }], authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect((await ledger.get("CP-29"))?.recordType).toBe("CANDIDATE_KNOWLEDGE");
  });

  it.each([
    ["missing statement", { statement: "" }, "STATEMENT_MISSING"],
    ["missing authority", { authority: "" }, "AUTHORITY_MISSING"],
    ["missing extraction", { extractionRefs: [] }, "EXTRACTION_MISSING"],
    ["unknown extraction", { extractionRefs: ["missing"] }, "EXTRACTION_INVALID"],
    ["unknown evidence", { evidenceRefs: ["missing"] }, "EVIDENCE_MISSING"],
  ])("rejects %s before persistence", async (_description, overrides, reasonCode) => {
    const ledger = await withExtraction();
    const result = await new CandidateKnowledgeService({ ledger }).propose({ statement: "candidate", classification: "PRINCIPLE", scope, authority: "HUMAN_PREFERENCE", extractionRefs: ["EX-401"], ...overrides });
    expect(result).toMatchObject({ status: "REJECTED", reasonCode, created: false, persistenceEffect: "NONE" });
  });
});
