import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { freezeIntent } from "@/services/intent/intentFreeze";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("freezeGovernance", () => {
  it("blocks frozen intent from planner eligibility", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "freeze-governance",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });
    freezeIntent(structured.intentId, "operator review");

    const result = validateIntentForPlanning(structured);
    expect(result.plannerEligible).toBe(false);
    expect(result.blockedReasons).toContain("FROZEN_INTENT_BLOCKED");
  });
});
