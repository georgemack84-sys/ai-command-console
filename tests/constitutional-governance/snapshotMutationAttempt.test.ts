import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture } from "./helpers";

describe("snapshot mutation attempts", () => {
  it("deny snapshot replacement and mutation", () => {
    const { view } = buildConstitutionalGovernanceFixture();
    const snapshotBoundary = view.authorityBoundaries.find((boundary) => boundary.authorityClass === "snapshot");

    expect(snapshotBoundary?.deniedOperations).toContain("mutate");
    expect(snapshotBoundary?.deniedOperations).toContain("replace");
  });
});
