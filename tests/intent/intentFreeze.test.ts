import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { enforceIntentFreezeProtection, freezeIntent, isIntentFrozen } from "@/services/intent/intentFreeze";

describe("intentFreeze", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("freezes dangerous or explicitly frozen intents", () => {
    createStructuredIntentRecord({
      intentId: "intent-freeze",
      rawInput: "inspect runtime status",
      createdAt: 0,
    });

    freezeIntent("intent-freeze", "drift");
    expect(isIntentFrozen("intent-freeze")).toBe(true);
    expect(() => enforceIntentFreezeProtection("intent-freeze")).toThrow("INTENT_FROZEN");
  });
});
