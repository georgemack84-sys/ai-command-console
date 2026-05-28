import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessFixture } from "./helpers";

describe("constitutional readiness integration", () => {
  it("builds a deterministic advisory-only readiness result", () => {
    const fixture = buildConstitutionalReadinessFixture();

    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.record.readinessClassification).toBe("VERIFIED");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.lineage.entries).toHaveLength(1);
  });

  it("preserves append-only lineage and ledger semantics", () => {
    const first = buildConstitutionalReadinessFixture();
    const second = buildConstitutionalReadinessFixture({
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
      readinessId: "readiness-2",
      createdAt: "2026-05-18T18:01:00.000Z",
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
