import { describe, expect, it } from "vitest";
import { buildSnapshotFixture } from "./helpers";

describe("snapshot revocation lineage", () => {
  it("preserves revocation ancestry without deleting history", () => {
    const fixture = buildSnapshotFixture({
      snapshotType: "revocation",
      payload: { placeholder: true },
    });

    expect(fixture.snapshot.snapshotType).toBe("revocation");
    expect(fixture.lineage.revocationAncestryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.revocation.replayContinuityPreserved).toBe(true);
  });
});
