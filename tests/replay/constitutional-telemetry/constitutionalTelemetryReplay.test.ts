import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";

describe("constitutional telemetry replay", () => {
  it("fails closed on replay instability", () => {
    const base = buildConstitutionalTelemetryFixture();
    const replay = Object.freeze({
      ...base.input.constitutionalReplayResult,
      record: Object.freeze({
        ...base.input.constitutionalReplayResult.record,
        classification: "DEGRADED" as const,
        replayDeterministic: false,
      }),
    });
    const fixture = buildConstitutionalTelemetryFixture({
      constitutionalReplayResult: replay,
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_TELEMETRY_REPLAY_MISMATCH")).toBe(true);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
