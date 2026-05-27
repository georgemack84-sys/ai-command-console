import { describe, expect, it } from "vitest";

import { bindAuditReplay } from "@/services/autonomy-audit-episode-model";
import { buildAutonomyAuditEpisodeFixture } from "./helpers";

describe("auditReplayBinder", () => {
  it("preserves original replay and lineage bindings", () => {
    const { input } = buildAutonomyAuditEpisodeFixture();
    const result = bindAuditReplay(input);
    expect(result.replayBinding.valid).toBe(true);
    expect(result.replayBinding.proposalLineageHash).toBe(input.proposal.lineage.lineageId);
    expect(result.replayBinding.overrideLineageHash).toBe(input.overrideContract.lineage.lineageId);
  });
});
