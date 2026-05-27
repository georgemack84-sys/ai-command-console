import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy adversarial", () => {
  it("blocks recursive workflow emergence and topology synthesis markers", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        recursiveWorkflowEmergence: true,
        topologySynthesis: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_RECURSIVE_WORKFLOW");
    expect(fixture.result.result.status === "blocked" || fixture.result.result.status === "frozen").toBe(true);
  });
});
