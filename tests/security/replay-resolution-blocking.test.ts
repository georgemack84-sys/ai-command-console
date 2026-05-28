import { beforeEach, describe, expect, it } from "vitest";

import { appendIntentLifecycleEvent, createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { resolveOperationalIntentForPlanning } from "@/services/intent/intentResolutionEngine";

describe("replay resolution blocking", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("blocks resolution when replay drift is detected", () => {
    const structured = createStructuredIntentRecord({
      intentId: "replay-resolution",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    appendIntentLifecycleEvent({
      eventId: "replay-resolution:drift",
      intentId: structured.intentId,
      previousState: "ACCEPTED",
      nextState: "DISPUTED",
      actor: "operator",
      timestamp: 999,
      createdAt: 999,
      reason: "drift",
    });

    const result = resolveOperationalIntentForPlanning(structured);

    expect(result.semanticGovernance.replayDriftDetected).toBe(true);
    expect(result.plannerAdmission.admissible).toBe(false);
  });
});
