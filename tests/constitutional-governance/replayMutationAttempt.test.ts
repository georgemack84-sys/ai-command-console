import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("replay mutation attempts", () => {
  it("deny replay mutation by boundary definition", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.replayAuthority.deniedOperations).toContain("mutate");
    expect(view.replayAuthority.deniedOperations).toContain("execute");
  });
});
