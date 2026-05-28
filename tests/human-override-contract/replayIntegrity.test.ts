import { describe, expect, it } from "vitest";

import { buildOverrideFixture } from "./helpers";

describe("override replay integrity", () => {
  it("preserves replay-safe reconstruction from immutable evidence", () => {
    const { contract } = buildOverrideFixture();
    expect(contract.replayBinding.deterministic).toBe(true);
    expect(contract.replayBinding.valid).toBe(true);
  });
});
