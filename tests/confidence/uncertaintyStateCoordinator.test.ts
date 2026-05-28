import { describe, expect, it } from "vitest";
import { coordinateUncertaintyState } from "@/services/confidence/uncertaintyStateCoordinator";
import { buildFreshnessFixture } from "@/tests/freshness/helpers";

describe("uncertainty state coordinator", () => {
  it("raises oversight when freshness is stale", () => {
    const { evaluation } = buildFreshnessFixture({
      evaluatedAt: "2026-05-17T06:55:00.000Z",
    });
    const result = coordinateUncertaintyState({ freshnessEvaluation: evaluation });
    expect(result.escalationState).not.toBe("normal");
  });
});
