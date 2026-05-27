import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

describe("constitutional replay security markers", () => {
  it("fails closed on runtime contamination attempts", () => {
    const result = buildConstitutionalReplayFixture({
      metadata: Object.freeze({ runtimeContamination: true }),
      scenarioCategory: "RUNTIME_CONTAMINATION",
    }).result;

    expect(result.errors.some((item) => item.code === "CONSTITUTIONAL_REPLAY_RUNTIME_CONTAMINATION")).toBe(true);
  });
});
