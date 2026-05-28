import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { resolveOperationalIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("contextual intent chaos", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("fails closed on compound unsafe ambiguous intent", () => {
    const structured = createStructuredIntentRecord({
      intentId: "contextual-chaos",
      rawInput: "force sync all nodes and wipe inactive databases",
      createdAt: 0,
    });

    const result = resolveOperationalIntentForPlanning(structured);

    expect(result.plannerAdmission.admissible).toBe(false);
    expect(result.contextualResolution.unsafeAssumptions.length).toBeGreaterThan(0);
    expect(result.clarification.clarificationRequired).toBe(true);
  });
});
