import { describe, expect, it } from "vitest";

import { ExtractionService, InMemoryProvenanceLedger, TeachingEventCaptureService } from "@/services/learning-constitution";
import { NOESIS_IDENTITY } from "@/types/learning-constitution";

const human = { actorId: "human:owner", actorType: "HUMAN" as const };
const noesis = { actorId: NOESIS_IDENTITY.systemId, actorType: "AGENT" as const };
const scope = { type: "PROJECT", id: "axiom" } as const;

const withTeaching = async () => {
  const ledger = new InMemoryProvenanceLedger();
  await new TeachingEventCaptureService({ ledger, createId: () => "TE-218", now: () => "2026-08-23T00:00:00.000Z" }).capture({ sourceType: "CONVERSATION", sourceActor: human, originalContent: "Keep Axiom primarily as a bedside terminal.", scopeHint: scope });
  return ledger;
};

describe("Noesis extraction service", () => {
  it("records an interpretation separately and links it to an unchanged Teaching Event", async () => {
    const ledger = await withTeaching();
    const service = new ExtractionService({ ledger, createId: () => "EX-401", createRelationshipId: () => "relationship-401", now: () => "2026-08-23T00:01:00.000Z" });

    const result = await service.extract({ sourceRefs: ["TE-218"], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "Axiom's primary physical role should remain a bedside AI terminal.", confidence: 0.96 });

    expect(result).toMatchObject({ status: "EXTRACTED", reasonCode: "EXTRACTION_RECORDED", extraction: { id: "EX-401", sourceRefs: ["TE-218"], interpretation: "Axiom's primary physical role should remain a bedside AI terminal.", immutable: true }, relationships: [{ type: "EXTRACTED_FROM", fromId: "EX-401", toId: "TE-218" }], authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect((await ledger.get("TE-218"))?.recordType).toBe("TEACHING_EVENT");
    expect((await ledger.get("TE-218") as { originalContent: string }).originalContent).toBe("Keep Axiom primarily as a bedside terminal.");
  });

  it.each([
    ["missing source", { sourceRefs: [] }, "SOURCE_MISSING"],
    ["missing interpretation", { interpretation: "" }, "INTERPRETATION_MISSING"],
    ["invalid confidence", { confidence: 1.1 }, "CONFIDENCE_INVALID"],
  ])("rejects %s without creating an extraction", async (_description, overrides, reasonCode) => {
    const ledger = await withTeaching();
    const result = await new ExtractionService({ ledger }).extract({ sourceRefs: ["TE-218"], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "meaning", confidence: 0.8, ...overrides });
    expect(result).toMatchObject({ status: "REJECTED", reasonCode, persistenceEffect: "NONE" });
  });

  it("will not interpret a non-source record as a Teaching Event", async () => {
    const ledger = await withTeaching();
    const result = await new ExtractionService({ ledger }).extract({ sourceRefs: ["TE-218"], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "first", confidence: 0.8 });
    const rejected = await new ExtractionService({ ledger }).extract({ sourceRefs: [result.extraction!.id], interpretedBy: noesis, classification: "PREFERENCE", scope, interpretation: "second", confidence: 0.8 });
    expect(rejected).toMatchObject({ status: "REJECTED", reasonCode: "SOURCE_NOT_TEACHING_EVENT" });
  });
});
