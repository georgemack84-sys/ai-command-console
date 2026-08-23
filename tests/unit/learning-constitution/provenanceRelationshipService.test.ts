import { describe, expect, it } from "vitest";

import { InMemoryProvenanceLedger, ProvenanceRelationshipService, TeachingEventCaptureService } from "@/services/learning-constitution";
import { NOESIS_IDENTITY } from "@/types/learning-constitution";

const human = { actorId: "human:owner", actorType: "HUMAN" as const };
const noesis = { actorId: NOESIS_IDENTITY.systemId, actorType: "AGENT" as const };
const seed = async () => {
  const ledger = new InMemoryProvenanceLedger();
  const capture = new TeachingEventCaptureService({ ledger, createId: (() => { let value = 217; return () => `TE-${++value}`; })() });
  await capture.capture({ sourceType: "CONVERSATION", sourceActor: human, originalContent: "first source" });
  await capture.capture({ sourceType: "DOCUMENT", sourceActor: human, originalContent: "second source" });
  await capture.capture({ sourceType: "APPROVED_REFERENCE", sourceActor: human, originalContent: "third source" });
  return ledger;
};

describe("Provenance relationship graph", () => {
  it("supports many independent sources converging on one provenance node", async () => {
    const ledger = await seed();
    await ledger.append({ id: "EX-410", recordType: "EXTRACTION", sourceRefs: ["TE-218", "TE-219", "TE-220"], interpretedBy: noesis, classification: "FACT", scope: { type: "PROJECT", id: "axiom" }, interpretation: "combined interpretation", confidence: 0.9, createdAt: "2026-08-23T00:00:00.000Z", immutable: true });
    const service = new ProvenanceRelationshipService({ ledger });
    for (const sourceId of ["TE-218", "TE-219", "TE-220"]) await service.relate({ fromId: "EX-410", toId: sourceId, type: "EXTRACTED_FROM", actor: noesis });

    expect((await ledger.getRelationships("EX-410")).filter((item) => item.type === "EXTRACTED_FROM").map((item) => item.toId)).toEqual(["TE-218", "TE-219", "TE-220"]);
  });

  it("is idempotent and rejects unknown endpoints, unknown actors, and self-links", async () => {
    const ledger = await seed();
    const service = new ProvenanceRelationshipService({ ledger });
    const request = { fromId: "TE-218", toId: "TE-219", type: "REFERENCES" as const, actor: noesis };
    expect((await service.relate(request)).status).toBe("CREATED");
    expect(await service.relate(request)).toMatchObject({ status: "EXISTS", reasonCode: "IDEMPOTENT_REPLAY", persistenceEffect: "NONE" });
    await expect(service.relate({ ...request, toId: "missing" })).resolves.toMatchObject({ status: "REJECTED", reasonCode: "ENDPOINT_MISSING" });
    await expect(service.relate({ ...request, fromId: "TE-218", toId: "TE-218" })).resolves.toMatchObject({ status: "REJECTED", reasonCode: "SELF_RELATIONSHIP" });
    await expect(service.relate({ ...request, actor: { actorId: "", actorType: "AGENT" } })).resolves.toMatchObject({ status: "REJECTED", reasonCode: "ACTOR_UNKNOWN" });
  });
});
