import { describe, expect, it } from "vitest";
import { buildReplayFixture, projectReplayLineage } from "./helpers";

describe("policy replay binding", () => {
  it("preserves original governance and policy replay bindings", () => {
    const fixture = buildReplayFixture();
    const lineage = projectReplayLineage(fixture.input);

    expect(lineage.governanceSnapshotHash).toBe(fixture.input.treaty.manifest.governanceSnapshotHash);
    expect(fixture.input.policyExplanation?.replayExplanation.replayHash).toBeTruthy();
  });
});
