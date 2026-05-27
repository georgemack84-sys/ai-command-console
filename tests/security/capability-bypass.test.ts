import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("capabilityBypass", () => {
  it("blocks undeclared capabilities even if semantically parsed", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "capability-bypass",
      rawInput: "teleport the database into a happier timeline",
      createdAt: 0,
    });

    const result = validateIntentForPlanning(structured);
    expect(result.plannerEligible).toBe(false);
    expect(result.blockedReasons).toContain("UNKNOWN_TOOL");
  });
});

