import { describe, expect, it } from "vitest";

import { bindProposalReplay } from "@/services/proposal-lifecycle-engine";
import { buildProposalFixture } from "./helpers";

describe("proposalReplayBinder", () => {
  it("preserves replay evidence without regenerating replay truth", () => {
    const { replay } = buildProposalFixture();
    const binding = bindProposalReplay({
      replay,
      readinessHash: "readiness-hash",
      snapshotLineageHash: "snapshot-lineage-hash",
    });
    expect(binding.reconstructionHash).toBe(replay.reconstructionHash);
    expect(binding.valid).toBe(true);
  });
});
