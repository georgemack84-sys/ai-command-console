import { describe, expect, it } from "vitest";
import { buildOperatorAuthorityFixture } from "./helpers";

describe("operator authority integration", () => {
  it("emits immutable lineage and audit records bound to upstream validation snapshots", () => {
    const fixture = buildOperatorAuthorityFixture();
    expect(fixture.result.lineage.entries.length).toBe(1);
    expect(fixture.result.auditLedger.length).toBe(2);
    expect(fixture.result.action.governanceSnapshotId)
      .toBe(fixture.input.recommendationValidationResult.result.governanceSnapshotId);
    expect(fixture.result.action.replaySnapshotId)
      .toBe(fixture.input.recommendationValidationResult.result.replaySnapshotId);
  });
});
