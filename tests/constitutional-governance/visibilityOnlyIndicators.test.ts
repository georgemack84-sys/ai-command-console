import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("visibility-only simulation and autonomy indicators", () => {
  it("preserve simulation isolation and autonomy visibility-only constraints", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.autonomyBoundary.visibilityOnly).toBe(true);
    expect(view.simulationScope.readOnly).toBe(true);
  });
});
