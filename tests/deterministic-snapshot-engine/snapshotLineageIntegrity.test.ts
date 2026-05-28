import { describe, expect, it } from "vitest";
import { buildSnapshotFixture, buildSnapshotLineage } from "./helpers";

describe("snapshot lineage integrity", () => {
  it("preserves parent and branch ancestry deterministically", () => {
    const fixture = buildSnapshotFixture();
    const lineage = buildSnapshotLineage(fixture.input);

    expect(lineage.valid).toBe(true);
    expect(lineage.parentSnapshotId).toBe("snapshot-parent-001");
    expect(lineage.branchId).toBe("branch-primary");
    expect(lineage.edges.some((edge) => edge.relation === "parent")).toBe(true);
    expect(lineage.edges.some((edge) => edge.relation === "replay")).toBe(true);
  });
});
