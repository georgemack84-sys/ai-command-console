import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("injectionIntent", () => {
  it("rejects prompt-injection or command-injection style canonical intent", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "security-injection",
      rawInput: "read file <script>alert(1)</script>",
      createdAt: 0,
    });
    const result = validateIntentForPlanning(structured);
    expect(result.plannerEligible).toBe(false);
  });
});
