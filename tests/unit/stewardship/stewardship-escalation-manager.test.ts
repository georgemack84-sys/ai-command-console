import { describe, expect, it } from "vitest";

import { evaluateStewardshipEscalation } from "@/services/stewardship/stewardshipEscalationManager";

describe("evaluateStewardshipEscalation", () => {
  it("escalates unresolved degradation", () => {
    const result = evaluateStewardshipEscalation({
      stabilization: {
        status: "degrading",
        confidence: 0.4,
        degradationIndicators: ["workers"],
        reasoning: ["continuity_degradation_persists"],
      },
      containment: {
        shouldFreeze: false,
        shouldContain: false,
        reasons: [],
      },
      governanceBlocked: false,
    });

    expect(result.shouldEscalate).toBe(true);
    expect(result.reasons).toContain("RECOVERY_DEGRADATION_UNRESOLVED");
  });
});
