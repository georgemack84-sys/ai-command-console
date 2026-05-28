import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "@/tests/integration/future-autonomy/helpers";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("future autonomy fail closed", () => {
  it("inherits upstream fail-closed states", () => {
    const drift = buildGovernanceDriftFixture();
    const governanceDriftResult = {
      ...drift.result,
      record: {
        ...drift.result.record,
        failClosed: true,
      },
    };
    const fixture = buildFutureAutonomyFixture({ governanceDriftResult });

    expect(fixture.result.result.status).toBe("blocked");
  });
});
