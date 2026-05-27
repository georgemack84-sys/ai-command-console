import { describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore, appendIntentLifecycleEvent } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("replayGovernance", () => {
  it("blocks planner eligibility on replay drift", () => {
    resetIntentStore();
    const structured = createStructuredIntentRecord({
      intentId: "replay-governance",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });
    appendIntentLifecycleEvent({
      eventId: "intent-event:replay-governance:ACCEPTED:DISPUTED:operator:999",
      intentId: structured.intentId,
      previousState: "ACCEPTED",
      nextState: "DISPUTED",
      actor: "operator",
      timestamp: 999,
      createdAt: 999,
      reason: "forced drift",
    });

    const result = validateIntentForPlanning(structured);
    expect(result.plannerEligible).toBe(false);
    expect(result.blockedReasons).toContain("INTENT_REPLAY_MISMATCH");
  });
});
