import { describe, expect, it } from "vitest";
import { buildReplayFixture, projectReplayLineage } from "./helpers";

describe("governance replay binding", () => {
  it("preserves original governance metadata and approval lineage", () => {
    const fixture = buildReplayFixture();
    const lineage = projectReplayLineage(fixture.input);

    expect(lineage.approvalChainHash).toBe(fixture.input.treaty.manifest.approvalChainHash);
    expect(lineage.governanceSnapshotHash).toBe(fixture.input.treaty.manifest.governanceSnapshotHash);
  });
});
