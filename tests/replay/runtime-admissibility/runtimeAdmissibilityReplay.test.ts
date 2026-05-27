import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility replay", () => {
  it("fails closed on replay incompatibility", () => {
    const replayFixture = buildRuntimeAdmissibilityFixture();
    const mutatedReplay = Object.freeze({
      ...replayFixture.input.constitutionalReplayResult,
      record: Object.freeze({
        ...replayFixture.input.constitutionalReplayResult.record,
        classification: "DEGRADED" as const,
        replayDeterministic: false,
      }),
    });
    const fixture = buildRuntimeAdmissibilityFixture({
      constitutionalReplayResult: mutatedReplay,
    });

    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_REPLAY_MISMATCH")).toBe(true);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
