import { describe, expect, it } from "vitest";

import { bindCoordinationReplay } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("coordinationReplayBinder", () => {
  it("preserves replay-safe coordination bindings", () => {
    const { input } = buildBoundedCoordinationFixture();
    const result = bindCoordinationReplay(input);
    expect(result.replayBinding.valid).toBe(true);
    expect(result.replayBinding.auditEpisodeHash).toBe(input.auditEpisode.episodeHash);
    expect(result.replayBinding.overrideLineageHash).toBe(input.overrideContract.lineage.lineageId);
  });
});
