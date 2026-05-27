import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

describe("coordination boundary enforcement", () => {
  it("reconstructs deterministic boundary validation", () => {
    const first = buildCoordinationBoundaryFixture();
    const second = buildCoordinationBoundaryFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("keeps valid coordination bounded and non-executing", () => {
    const fixture = buildCoordinationBoundaryFixture();
    expect(fixture.result.record.verdict).toBe("VALID_BOUND_COORDINATION");
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
  });
});
