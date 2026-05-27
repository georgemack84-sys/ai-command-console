import { describe, expect, it } from "vitest";
import { buildConstitutionalGovernanceFixture, buildConstitutionalGovernanceView } from "./helpers";

describe("large governance determinism", () => {
  it("remain stable with additional snapshot lineage", () => {
    const fixture = buildConstitutionalGovernanceFixture();
    const inflated = buildConstitutionalGovernanceView({
      ...fixture.input,
      snapshots: Object.freeze([
        ...fixture.input.snapshots,
        ...fixture.input.snapshots.map((snapshot, index) => Object.freeze({
          ...snapshot,
          snapshotId: `${snapshot.snapshotId}:copy:${index}`,
        })),
      ]),
    });
    const repeated = buildConstitutionalGovernanceView({
      ...fixture.input,
      snapshots: Object.freeze([
        ...fixture.input.snapshots,
        ...fixture.input.snapshots.map((snapshot, index) => Object.freeze({
          ...snapshot,
          snapshotId: `${snapshot.snapshotId}:copy:${index}`,
        })),
      ]),
    });

    expect(inflated.constitutionalDecisionHash).toBe(repeated.constitutionalDecisionHash);
  });
});
