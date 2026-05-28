import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { verifyIntentIntegrity } from "@/services/intent/intentIntegrity";

describe("intentIntegrity", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("preserves immutable audit and replay integrity for stable intents", () => {
    createStructuredIntentRecord({
      intentId: "intent-integrity",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    expect(verifyIntentIntegrity("intent-integrity").valid).toBe(true);
  });
});
