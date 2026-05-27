import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildConstitutionalReplayStabilityFixture();
    const second = buildConstitutionalReplayStabilityFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.forensicExport.exportHash).toBe(second.result.forensicExport.exportHash);
  });

  it("never reconstructs present-state interpretation", () => {
    const fixture = buildConstitutionalReplayStabilityFixture();

    expect(fixture.result.record.classification).toBe("STABLE");
    expect(fixture.result.record.failClosed).toBe(false);
  });
});
