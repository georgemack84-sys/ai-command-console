import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "./helpers";

describe("proposal approval binding integration", () => {
  it("preserves deterministic replay-safe approval governance bindings", () => {
    const first = buildProposalApprovalBindingFixture();
    const second = buildProposalApprovalBindingFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.replayResult.replayHash).toBe(second.result.replayResult.replayHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });

  it("preserves append-only auditability", () => {
    const fixture = buildProposalApprovalBindingFixture();

    expect(fixture.result.auditLedger.length).toBe(fixture.result.auditEntries.length);
    expect(fixture.result.auditEntries.every((entry) => entry.appendOnly)).toBe(true);
  });
});
