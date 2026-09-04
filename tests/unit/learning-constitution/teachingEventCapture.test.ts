import { describe, expect, it } from "vitest";

import { InMemoryProvenanceLedger, TeachingEventCaptureService } from "@/services/learning-constitution";

const sourceActor = { actorId: "human:owner", actorType: "HUMAN" as const };

describe("Teaching Event capture", () => {
  it("preserves supplied content as an immutable source without interpreting it", async () => {
    const ledger = new InMemoryProvenanceLedger();
    const service = new TeachingEventCaptureService({ ledger, now: () => "2026-08-23T12:00:00.000Z", createId: () => "TE-218" });

    const result = await service.capture({
      sourceType: "CONVERSATION", sourceActor,
      originalContent: "Keep Axiom primarily as a bedside terminal.",
      scopeHint: { type: "PROJECT", id: "axiom" },
    });

    expect(result).toMatchObject({ status: "CAPTURED", reasonCode: "TEACHING_EVENT_CAPTURED", created: true, persistenceEffect: "CREATED", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
    expect(result.teachingEvent).toEqual({ id: "TE-218", recordType: "TEACHING_EVENT", sourceType: "CONVERSATION", sourceActor, originalContent: "Keep Axiom primarily as a bedside terminal.", receivedAt: "2026-08-23T12:00:00.000Z", scopeHint: { type: "PROJECT", id: "axiom" }, immutable: true });
    expect(await ledger.get("TE-218")).toEqual(result.teachingEvent);
  });

  it.each([
    ["missing content", { originalContent: "", sourceActor }, "CONTENT_MISSING"],
    ["unknown actor", { originalContent: "teaching", sourceActor: { actorId: "", actorType: "HUMAN" as const } }, "ACTOR_UNKNOWN"],
    ["invalid timestamp", { originalContent: "teaching", sourceActor, receivedAt: "not-a-date" }, "TIMESTAMP_INVALID"],
  ])("rejects %s without durable effects", async (_description, input, reasonCode) => {
    const service = new TeachingEventCaptureService({ ledger: new InMemoryProvenanceLedger() });
    const result = await service.capture({ sourceType: "HUMAN_ENTRY", ...input });
    expect(result).toMatchObject({ status: "REJECTED", reasonCode, created: false, persistenceEffect: "NONE" });
  });

  it("fails closed when the provenance ledger cannot append", async () => {
    const service = new TeachingEventCaptureService({
      ledger: { append: async () => { throw new Error("offline"); }, relate: async () => { throw new Error("unused"); }, get: async () => undefined, getRelationships: async () => [], getAll: async () => [] },
    });
    await expect(service.capture({ sourceType: "CONVERSATION", sourceActor, originalContent: "teaching" })).resolves.toMatchObject({ status: "PERSISTENCE_FAILED", persistenceEffect: "NONE" });
  });
});
