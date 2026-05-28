import { describe, expect, it } from "vitest";

import { deriveFreezeState } from "@/services/human-override-contract";
import { buildOverrideFixture } from "./helpers";

describe("freezeStateDeriver", () => {
  it("derives freeze state from lineage instead of mutable toggles", () => {
    const { input } = buildOverrideFixture();
    const freeze = deriveFreezeState(input.events, input.governanceView.constitutionalDecisionHash);
    expect(freeze.active).toBe(true);
    expect(freeze.freezeType).toBe("hard");
  });
});
