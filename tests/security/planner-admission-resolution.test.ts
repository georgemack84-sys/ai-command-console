import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { resolveOperationalIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("planner admission resolution", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("denies planner admission for unresolved context", () => {
    const structured = createStructuredIntentRecord({
      intentId: "planner-admission-resolution",
      rawInput: "restart app",
      createdAt: 0,
    });

    const result = resolveOperationalIntentForPlanning(structured);

    expect(result.plannerAdmission.admissible).toBe(false);
    expect(result.clarification.clarificationRequired).toBe(true);
    expect(result.clarification.blockingReasons.some((reason) => reason.startsWith("MISSING_CONTEXT:"))).toBe(true);
  });
});
