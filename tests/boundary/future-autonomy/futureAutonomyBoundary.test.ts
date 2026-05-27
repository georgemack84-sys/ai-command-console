import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";

describe("future autonomy boundary", () => {
  it("freezes on hidden orchestration and workflow continuation markers", () => {
    const fixture = buildFutureAutonomyFixture({
      metadata: {
        hiddenOrchestration: true,
        workflowContinuation: true,
      },
    });

    expect(fixture.result.result.orchestrationAllowed).toBe(false);
    expect(fixture.result.result.status).not.toBe("safe");
  });
});
