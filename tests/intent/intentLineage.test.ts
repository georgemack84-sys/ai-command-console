import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { verifyIntentLineage } from "@/services/intent/intentLineage";

describe("intentLineage", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("builds lineage ids for persisted intents", () => {
    const intent = createStructuredIntentRecord({
      intentId: "intent-lineage",
      rawInput: "inspect governance freeze",
      createdAt: 0,
    });

    expect(intent.lineageId).toMatch(/^intent-lineage:/);
    expect(verifyIntentLineage("intent-lineage").valid).toBe(true);
  });
});
