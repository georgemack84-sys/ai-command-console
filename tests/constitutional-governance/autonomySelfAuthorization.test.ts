import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("autonomy self-authorization", () => {
  it("deny self-authorization operations", () => {
    const { view } = buildConstitutionalGovernanceFixture();

    expect(view.autonomyBoundary.visibilityOnly).toBe(true);
    expect(view.autonomyBoundary.deniedOperations).toContain("self-authorize");
  });
});
