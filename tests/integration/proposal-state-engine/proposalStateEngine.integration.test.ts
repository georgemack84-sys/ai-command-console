import { buildProposalStateEngineFixture } from "@/tests/integration/proposal-state-engine/helpers";

describe("proposal state engine integration", () => {
  it("preserves append-only history", () => {
    const first = buildProposalStateEngineFixture();
    const second = buildProposalStateEngineFixture({
      existingAuditLedger: first.result.auditLedger,
      existingLineage: first.result.lineage,
      currentState: "validated",
      transition: {
        ...first.input.transition,
        transitionId: "proposal-transition-2",
        sourceState: "validated",
        targetState: "governed",
        auditLineageId: first.result.auditRecords.at(-1)!.auditEventId,
      },
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[first.result.auditLedger.length]?.previousHash).toBe(first.result.auditLedger.at(-1)?.entryHash);
    expect(second.result.lineage.transitionIds).toEqual(["proposal-transition-1", "proposal-transition-2"]);
  });

  it("preserves deterministic replay and governance reconstruction", () => {
    const first = buildProposalStateEngineFixture();
    const second = buildProposalStateEngineFixture();

    expect(second.result.replayAdmissibility).toEqual(first.result.replayAdmissibility);
    expect(second.result.governanceBinding).toEqual(first.result.governanceBinding);
    expect(second.result.deterministicHash).toBe(first.result.deterministicHash);
  });

  it("preserves audit reconstruction and lineage ancestry", () => {
    const fixture = buildProposalStateEngineFixture();

    expect(fixture.result.auditRecords[0]?.eventType).toBe("proposal.state.transition.requested");
    expect(fixture.result.auditRecords.some((record) => record.eventType === "proposal.state.transition.applied")).toBe(true);
    expect(fixture.result.lineage.auditEventIds).toContain(fixture.result.transitionResult.auditEventId);
  });
});
