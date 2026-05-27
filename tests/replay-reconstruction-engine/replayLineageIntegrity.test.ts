import { describe, expect, it } from "vitest";
import { buildReplayFixture, projectReplayLineage } from "./helpers";

describe("replay lineage integrity", () => {
  it("binds lineage to original frozen treaty hashes", () => {
    const fixture = buildReplayFixture();
    const lineage = projectReplayLineage(fixture.input);

    expect(lineage.treatyId).toBe(fixture.input.treaty.manifest.treatyId);
    expect(lineage.replaySnapshotHash).toBe(fixture.input.treaty.manifest.replaySnapshotHash);
    expect(lineage.replayBindingHash).toBe(fixture.input.treaty.manifest.replayBindingHash);
  });
});
