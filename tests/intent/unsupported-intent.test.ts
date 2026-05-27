import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { resolveIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("unsupportedIntent", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("blocks unsupported intent from planner-safe output", () => {
    const structured = createStructuredIntentRecord({
      intentId: "unsupported-intent",
      rawInput: "teleport the database into a happier timeline",
      createdAt: 0,
    });

    const result = resolveIntentForPlanning(structured);
    expect(result.valid).toBe(false);
    expect(result.blockedReasons).toContain("INTENT_UNSUPPORTED");
  });
});
