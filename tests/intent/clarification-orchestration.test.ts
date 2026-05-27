import { describe, expect, it } from "vitest";

import { orchestrateIntentClarification } from "@/services/intent/intentClarificationOrchestrator";

describe("clarification orchestration", () => {
  it("generates deterministic clarification questions", () => {
    const result = orchestrateIntentClarification({
      missingContext: ["environment", "rollbackPolicy"],
      conflictingContext: [],
      unsafeAssumptions: ["UNSAFE_PRODUCTION_INFERENCE"],
      ambiguityDetected: true,
      protectedTargetDetected: false,
    });

    expect(result.clarificationRequired).toBe(true);
    expect(result.generatedQuestions).toEqual([
      "Which environment should be targeted?",
      "Should rollback capability be enabled?",
      "Is this intended for production?",
    ]);
  });
});
