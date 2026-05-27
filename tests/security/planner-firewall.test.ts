import { beforeEach, describe, expect, it } from "vitest";

import { appendIntentLifecycleEvent, createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { validateIntentForPlanning } from "@/services/intent/plannerEligibilityValidator";

describe("planner firewall", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("denies replay-drifted intent from entering planning", () => {
    const structured = createStructuredIntentRecord({
      intentId: "planner-firewall-drift",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    appendIntentLifecycleEvent({
      eventId: "planner-firewall-drift:replay-mismatch",
      intentId: structured.intentId,
      previousState: "ACCEPTED",
      nextState: "DISPUTED",
      actor: "operator",
      timestamp: 999,
      createdAt: 999,
      reason: "manual divergence",
    });

    const result = validateIntentForPlanning(structured);

    expect(result.plannerEligible).toBe(false);
    expect(result.semanticGovernance.replayDriftDetected).toBe(true);
    expect(result.semanticGovernance.plannerBlockReasons).toContain("REPLAY_DRIFT_DETECTED");
  });
});
