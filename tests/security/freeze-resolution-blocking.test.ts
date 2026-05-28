import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { freezeIntent } from "@/services/intent/intentFreeze";
import { resolveOperationalIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("freeze resolution blocking", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("blocks resolution when intent is frozen", () => {
    const structured = createStructuredIntentRecord({
      intentId: "freeze-resolution",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    freezeIntent(structured.intentId, "test-freeze");
    const result = resolveOperationalIntentForPlanning(structured);

    expect(result.semanticGovernance.freezeActive).toBe(true);
    expect(result.plannerAdmission.admissible).toBe(false);
  });
});
