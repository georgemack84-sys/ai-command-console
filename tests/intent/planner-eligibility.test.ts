import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("plannerEligibility", () => {
  it("allows planner-safe canonical intents only", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "planner-eligible",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const result = validateIntentForPlanning(structured);
    expect(result.plannerEligible).toBe(true);
  });
});
