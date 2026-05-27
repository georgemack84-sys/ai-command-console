import { describe, expect, it } from "vitest";
import { bindEscalationReplay } from "@/services/constitutional-escalation-layer";
import { buildConstitutionalEscalationFixture } from "./helpers";

describe("bindEscalationReplay", () => {
  it("preserves original replay lineage hashes", () => {
    const { input } = buildConstitutionalEscalationFixture();
    const result = bindEscalationReplay(input);

    expect(result.replayBinding.proposalLineageHash).toBe(input.auditEpisode.replayBinding.proposalLineageHash);
    expect(result.replayBinding.snapshotLineageHash).toBe(input.auditEpisode.replayBinding.snapshotLineageHash);
  });
});
