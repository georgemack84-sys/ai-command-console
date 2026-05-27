import { describe, expect, it } from "vitest";

import { bindTriggerReplay } from "@/services/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "./helpers";

describe("triggerReplayBinder", () => {
  it("preserves historical replay bindings", () => {
    const { input } = buildMonitoringTriggerFixture();
    const result = bindTriggerReplay(input);
    expect(result.replayBinding.valid).toBe(true);
    expect(result.replayBinding.proposalLineageHash).toBe(input.proposal.lineage.lineageId);
    expect(result.replayBinding.approvalGraphHash).toBe(input.approvalGraph.graphHash);
    expect(result.replayBinding.overrideLineageHash).toBe(input.overrideContract.lineage.lineageId);
  });
});
