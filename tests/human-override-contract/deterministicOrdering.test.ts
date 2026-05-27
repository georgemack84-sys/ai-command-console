import { describe, expect, it } from "vitest";

import { buildOverrideFixture } from "./helpers";

describe("override deterministic ordering", () => {
  it("orders lineage deterministically across equivalent inputs", () => {
    const first = buildOverrideFixture();
    const second = buildOverrideFixture();
    expect(first.contract.lineage.entries).toEqual(second.contract.lineage.entries);
  });
});
