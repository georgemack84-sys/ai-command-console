import { beforeEach, describe, expect, it } from "vitest";

import { createStructuredIntentRecord, resetIntentStore } from "@/services/intent/intentPersistence";
import { transitionIntentLifecycle } from "@/services/intent/intentLifecycleManager";
import { freezeIntent } from "@/services/intent/intentFreeze";

describe("intentLifecycleManager", () => {
  beforeEach(() => {
    resetIntentStore();
  });

  it("enforces disputed and frozen transition rules", () => {
    const intent = createStructuredIntentRecord({
      intentId: "intent-lifecycle",
      rawInput: "read file src/app.ts",
      createdAt: 0,
    });

    expect(intent.lifecycleState).toBe("ACCEPTED");
    freezeIntent("intent-lifecycle", "review");

    const disputed = transitionIntentLifecycle({
      intentId: "intent-lifecycle",
      fromState: "FROZEN",
      toState: "DISPUTED",
      actor: "operator",
      timestamp: 10,
    });

    expect(disputed.intent.lifecycleState).toBe("DISPUTED");
    expect(() => transitionIntentLifecycle({
      intentId: "intent-lifecycle",
      fromState: "DISPUTED",
      toState: "ACCEPTED",
      actor: "operator",
      timestamp: 11,
    })).toThrow("SEMANTIC_CONFLICT");
  });
});
