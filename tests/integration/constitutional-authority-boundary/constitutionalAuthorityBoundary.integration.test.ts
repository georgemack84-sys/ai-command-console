import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "./helpers";

describe("constitutional authority boundary integration", () => {
  it("builds a deterministic, governance-bound authority boundary", () => {
    const fixture = buildConstitutionalAuthorityBoundaryFixture();

    expect(fixture.result.record.certificationState).toBe("CERTIFIED");
    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.errors).toHaveLength(0);
  });

  it("preserves append-only lineage and ledger behavior", () => {
    const first = buildConstitutionalAuthorityBoundaryFixture();
    const second = buildConstitutionalAuthorityBoundaryFixture({
      boundaryId: "authority-boundary-2",
      createdAt: "2026-05-18T20:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
