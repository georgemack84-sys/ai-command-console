import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

describe("constitutional replay attack replay", () => {
  it("fails closed on replay repair attempts", () => {
    const result = buildConstitutionalReplayFixture({
      metadata: Object.freeze({ replayRepair: true, adaptiveReplay: true }),
    }).result;

    expect(result.errors.some((item) => item.code === "CONSTITUTIONAL_REPLAY_REPAIR_ATTEMPT")).toBe(true);
  });
});
