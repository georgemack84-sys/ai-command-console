import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("destructivePlanning", () => {
  it("blocks destructive disabled capabilities from planning", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "destructive-planning",
      rawInput: "restart app",
      createdAt: 0,
    });

    const result = validateIntentForPlanning(structured);
    expect(result.plannerEligible).toBe(false);
    expect(result.blockedReasons).toContain("DISABLED_TOOL");
  });
});
