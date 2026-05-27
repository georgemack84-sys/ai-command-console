import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring replay", () => {
  it("fails closed when replay determinism degrades", () => {
    const base = buildConstitutionalReadinessScoringFixture();
    const fixture = buildConstitutionalReadinessScoringFixture({
      constitutionalReplayResult: {
        ...base.input.constitutionalReplayResult,
        record: {
          ...base.input.constitutionalReplayResult.record,
          replayDeterministic: false,
        },
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_READINESS_REPLAY_NONDETERMINISTIC")).toBe(true);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
