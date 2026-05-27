import { describe, expect, it } from "vitest";

import { buildMonitoringTriggerFixture } from "./helpers";

describe("monitoring trigger replay integrity", () => {
  it("keeps replay bindings historical and immutable", () => {
    const { model, input } = buildMonitoringTriggerFixture();
    expect(model.replayBinding.reconstructionHash).toBe(input.replay.reconstructionHash);
    expect(model.replayBinding.governanceSnapshotHash).toBe(input.governanceView.policy.policySnapshotHash);
    expect(model.replayBinding.snapshotLineageHash).toBe(input.proposal.snapshotBinding.snapshotLineageHash);
    expect(model.replayBinding.deterministic).toBe(true);
  });
});
