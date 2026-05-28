import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { resolveIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("failClosedValidation", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("requires clarification for unresolved ambiguous operations", () => {
    const structured = createStructuredIntentRecord({
      intentId: "ambiguous-intent",
      rawInput: "restart production",
      createdAt: 0,
    });

    const result = resolveIntentForPlanning(structured);
    expect(result.valid).toBe(false);
    expect(result.clarificationRequired).toBe(true);
    expect(result.blockedReasons).toContain("INTENT_AMBIGUOUS");
  });
});
