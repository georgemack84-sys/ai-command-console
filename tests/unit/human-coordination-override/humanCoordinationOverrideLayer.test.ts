import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

describe("human coordination override", () => {
  it("reconstructs deterministic override state", () => {
    const first = buildHumanCoordinationOverrideFixture();
    const second = buildHumanCoordinationOverrideFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("allows human pause authority without adding execution power", () => {
    const fixture = buildHumanCoordinationOverrideFixture({
      overrideType: "pause",
    });
    expect(fixture.result.record.overrideState).toBe("paused");
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
  });
});
