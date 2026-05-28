import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("coordination readiness certification", () => {
  it("reconstructs deterministic certification output", () => {
    const first = buildCoordinationReadinessFixture();
    const second = buildCoordinationReadinessFixture();
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("certifies healthy coordination without adding authority", () => {
    const fixture = buildCoordinationReadinessFixture();
    expect(fixture.result.record.certificationState).toBe("CERTIFIED");
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
  });
});
