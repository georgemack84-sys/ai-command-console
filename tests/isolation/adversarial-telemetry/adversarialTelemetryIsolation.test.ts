import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry isolation", () => {
  it("detects execution imports and runtime bridges", () => {
    const fixture = buildAdversarialTelemetryFixture({
      metadata: {
        executionImport: "node:child_process",
        runtimeBridges: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("ADVERSARIAL_TELEMETRY_ISOLATION_VIOLATION");
    expect(fixture.result.record.telemetryState).toBe("blocked");
  });
});
