import { describe, expect, it } from "vitest";

import { buildOverrideFixture } from "./helpers";

describe("overrideContractEngine", () => {
  it("builds deterministic override contracts from immutable evidence", () => {
    const first = buildOverrideFixture();
    const second = buildOverrideFixture();
    expect(first.contract.overrideHash).toBe(second.contract.overrideHash);
    expect(first.contract.derivedOnly).toBe(true);
  });
});
