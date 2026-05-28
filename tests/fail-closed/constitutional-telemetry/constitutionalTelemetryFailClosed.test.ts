import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";

describe("constitutional telemetry fail-closed", () => {
  it("invalidates telemetry on authority crossover markers", () => {
    const fixture = buildConstitutionalTelemetryFixture({
      metadata: Object.freeze({ telemetryTriggeredAction: true }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_TELEMETRY_AUTHORITY_CROSSOVER")).toBe(true);
    expect(fixture.result.record.telemetryState).toBe("invalid");
  });
});
