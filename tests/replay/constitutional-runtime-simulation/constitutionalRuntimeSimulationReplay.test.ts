import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";

describe("constitutional runtime simulation replay", () => {
  it("fails closed on replay mismatch", () => {
    const base = buildConstitutionalRuntimeSimulationFixture();
    const replay = Object.freeze({
      ...base.input.constitutionalReplayResult,
      record: Object.freeze({
        ...base.input.constitutionalReplayResult.record,
        replayDeterministic: false,
      }),
    });
    const telemetry = Object.freeze({
      ...base.input.constitutionalTelemetryResult,
      record: Object.freeze({
        ...base.input.constitutionalTelemetryResult.record,
        replaySafe: false,
      }),
    });
    const fixture = buildConstitutionalRuntimeSimulationFixture({
      constitutionalReplayResult: replay,
      constitutionalTelemetryResult: telemetry,
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_RUNTIME_SIMULATION_REPLAY_MISMATCH")).toBe(true);
    expect(fixture.result.report.outcome).toBe("FAILED_CLOSED");
  });
});
