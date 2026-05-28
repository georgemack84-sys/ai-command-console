import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("governanceValidation", () => {
  it("requires review or blocks governance-risky canonical intent", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "gov-validation",
      rawInput: "scan ports",
      createdAt: 0,
    });

    const result = validateIntentForPlanning(structured);
    expect(result.governance.approvalRequired).toBe(true);
    expect(result.plannerEligible).toBe(false);
  });
});
