import { describe, expect, it } from "vitest";

import { evaluateIntentConfidence } from "@/services/intent/confidenceEvaluator";

describe("confidenceEvaluator", () => {
  it("lowers confidence for ambiguity and danger", () => {
    const result = evaluateIntentConfidence({
      source: "ai",
      ambiguities: ["target_unresolved"],
      warnings: ["warning"],
      supported: true,
      dangerous: true,
    });

    expect(result.confidence).toBeLessThan(0.7);
    expect(result.clarificationRequired).toBe(true);
  });
});
