import { describe, expect, it } from "vitest";

import { bindProposalSnapshots } from "@/services/proposal-lifecycle-engine";
import { buildSnapshotFixture } from "@/tests/deterministic-snapshot-engine/helpers";

describe("proposalSnapshotBinder", () => {
  it("preserves immutable snapshot lineage", () => {
    const { snapshot } = buildSnapshotFixture();
    const binding = bindProposalSnapshots(Object.freeze([snapshot]));
    expect(binding.valid).toBe(true);
    expect(binding.snapshotLineageHashes).toContain(snapshot.lineageId);
  });
});
