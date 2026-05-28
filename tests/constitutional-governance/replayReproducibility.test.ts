import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("replay reproducibility", () => {
  it("preserve original replay snapshot and lineage hashes", () => {
    const { input, view } = buildConstitutionalGovernanceFixture();

    expect(view.replayAuthority.replaySnapshotHash).toBe(input.treaty.manifest.replaySnapshotHash);
    expect(view.replayAuthority.replayLineageHash).toBe(input.treaty.evidence.replayLineageHash);
  });
});
