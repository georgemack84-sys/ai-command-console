import { beforeEach, describe, expect, it } from "vitest";

import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";
import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";

describe("semantic governance", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("allows planner admission for stable governed intent", () => {
    const structured = createStructuredIntentRecord({
      intentId: "semantic-governance-stable",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const result = validateIntentForPlanning(structured);

    expect(result.plannerEligible).toBe(true);
    expect(result.semanticGovernance.plannerAdmissible).toBe(true);
    expect(result.semanticGovernance.nextState).toBe("ALLOW_PLANNING");
  });
});
