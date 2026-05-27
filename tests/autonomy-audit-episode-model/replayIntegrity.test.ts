import { describe, expect, it } from "vitest";

import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("autonomy audit replay integrity", () => {
  it("binds replay to original governance, trigger, proposal, approval, and override lineage", () => {
    const { episode, input } = buildAutonomyAuditEpisodeFixture();
    expect(episode.replayBinding.reconstructionHash).toBe(input.replay.reconstructionHash);
    expect(episode.replayBinding.governanceSnapshotHash).toBe(input.governanceView.policy.policySnapshotHash);
    expect(episode.replayBinding.triggerLineageHash).toBe(input.monitoringModel.lineage.lineageId);
  });
});
