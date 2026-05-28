import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("simulation execution attempts", () => {
  it("keep simulation visibility-only and non-executing", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.simulationScope.readOnly).toBe(true);
    expect(view.simulationScope.deniedOperations).toContain("execute");
  });
});
