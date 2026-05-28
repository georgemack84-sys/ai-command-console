import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture, buildConstitutionalGovernanceView } from "./helpers";

describe("disputed lineage handling", () => {
  it("deny when snapshot lineage becomes disputed", () => {
    const fixture = buildConstitutionalGovernanceFixture();
    const view = buildConstitutionalGovernanceView({
      ...fixture.input,
      snapshots: fixture.input.snapshots.map((snapshot, index) => (
        index === 0
          ? Object.freeze({ ...snapshot, lineageId: "" })
          : snapshot
      )),
    });

    expect(view.snapshotAccess.decision).toBe("DENY");
    expect(view.state).toBe("DENY");
  });
});
