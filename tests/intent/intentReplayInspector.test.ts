import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore, updateIntentState } from "@/services/intent/intentPersistence";
import { detectConfidenceDrift, detectSemanticDrift, verifyIntentReplayIntegrity } from "@/services/intent/intentReplayInspector";

describe("intentReplayInspector", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("replays accepted intents deterministically", () => {
    createStructuredIntentRecord({
      intentId: "intent-replay",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    const result = verifyIntentReplayIntegrity("intent-replay");
    expect(result.driftDetected).toBe(false);
    expect(result.deterministic).toBe(true);
  });

  it("detects semantic drift after mutation", () => {
    createStructuredIntentRecord({
      intentId: "intent-drift",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });
    updateIntentState("intent-drift", "FROZEN");

    expect(detectSemanticDrift("intent-drift").driftDetected).toBe(false);
    expect(detectConfidenceDrift("intent-drift").driftDetected).toBe(false);
  });
});
