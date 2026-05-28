import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("canonicalIntentValidation", () => {
  it("validates canonical intent before planner eligibility", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "canonical-intent",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const result = validateIntentForPlanning(structured);
    expect(result.validation.registryValid).toBe(true);
    expect(result.canonicalIntent?.action).toBe("filesystem.read.file");
  });
});
