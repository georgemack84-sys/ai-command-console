import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy isolation", () => {
  it("detects execution imports and runtime bridges", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        executionImport: "node:child_process",
        simulationRuntimeBridge: true,
      },
    });

    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_EXECUTION_IMPORT");
    expect(fixture.result.errors.map((item) => item.code)).toContain("FUTURE_AUTONOMY_SIMULATION_RUNTIME_BRIDGE");
    expect(fixture.result.result.status).toBe("blocked");
  });
});
