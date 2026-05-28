import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("branch authority validation", () => {
  it("preserve branch lineage visibility from immutable snapshots", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.snapshotAccess.branchAuthorityValid).toBe(true);
    expect(view.snapshotAccess.visibleSnapshotIds.length).toBeGreaterThan(0);
  });
});
