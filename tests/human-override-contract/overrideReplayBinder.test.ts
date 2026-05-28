import { describe, expect, it } from "vitest";

import { bindOverrideReplay } from "@/services/human-override-contract";
import { buildOverrideFixture } from "./helpers";

describe("overrideReplayBinder", () => {
  it("binds overrides to original replay evidence only", () => {
    const { input } = buildOverrideFixture();
    const result = bindOverrideReplay({
      event: input.events[0],
      proposal: input.proposal,
      approvalGraph: input.approvalGraph,
      replay: input.replay,
      lineageHash: "override-lineage",
    });
    expect(result.replayBinding.valid).toBe(true);
    expect(result.replayBinding.reconstructionHash).toBe(input.replay.reconstructionHash);
  });
});
