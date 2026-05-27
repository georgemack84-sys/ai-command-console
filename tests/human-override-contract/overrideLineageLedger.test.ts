import { describe, expect, it } from "vitest";

import { appendOverrideLineage, deriveFreezeState } from "@/services/human-override-contract";
import { buildOverrideFixture } from "./helpers";

describe("overrideLineageLedger", () => {
  it("appends immutable lineage without rewriting history", () => {
    const { input } = buildOverrideFixture();
    const freezeState = deriveFreezeState(input.events, input.governanceView.constitutionalDecisionHash);
    const lineage = appendOverrideLineage({
      event: input.events[0],
      freezeState,
      replayHash: input.replay.reconstructionHash,
      lineageHash: "lineage-hash",
    });
    expect(lineage.entries).toHaveLength(1);
    expect(lineage.immutable).toBe(true);
  });
});
