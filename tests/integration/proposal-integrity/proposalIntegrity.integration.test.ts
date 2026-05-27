import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "./helpers";

describe("proposal integrity integration", () => {
  it("creates immutable snapshot, evidence, and audit ledger", () => {
    const fixture = buildProposalIntegrityFixture();
    expect(fixture.result.snapshot.snapshotHash).toBeTruthy();
    expect(fixture.result.evidence.evidenceHash).toBeTruthy();
    expect(fixture.result.auditLedger.length).toBe(2);
  });
});
