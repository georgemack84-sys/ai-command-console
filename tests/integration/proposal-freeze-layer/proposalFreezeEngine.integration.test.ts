import { buildProposalFreezeFixture } from "@/tests/integration/proposal-freeze-layer/helpers";

describe("proposal freeze integration", () => {
  it("propagates freeze blocks deterministically across downstream systems", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      recommendationReplayResult: Object.freeze({
        ...base.input.recommendationReplayResult,
        status: "FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.propagation).toHaveLength(7);
    expect(fixture.result.propagation.every((record) => record.blocked === true)).toBe(true);
  });

  it("preserves replay, governance, lineage, and audit reconstruction while frozen", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      constitutionalEnforcementResult: Object.freeze({
        ...base.input.constitutionalEnforcementResult,
        status: "FAILED_CLOSED" as const,
        verdict: Object.freeze({
          ...base.input.constitutionalEnforcementResult.verdict,
          status: "REJECTED" as const,
        }),
      }),
    });

    expect(fixture.result.status).toBe("PERMANENTLY_FROZEN");
    expect(fixture.result.freezeRecord.replaySnapshotId).toBe(base.input.proposalIntegrityResult.proposal.replaySnapshotId);
    expect(fixture.result.freezeRecord.governanceSnapshotId).toBe(base.input.proposalIntegrityResult.proposal.governanceSnapshotId);
    expect(fixture.result.lineage.entries.at(-1)?.freezeId).toBe(fixture.result.freezeRecord.freezeId);
    expect(fixture.result.auditRecords.at(-1)?.eventType).toBe("FREEZE_AUDITED");
  });

  it("blocks lifecycle progression while a freeze already exists", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      existingFreezeRecord: Object.freeze({
        ...base.result.freezeRecord,
        freezeState: "FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("PERMANENTLY_FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_STATE_BYPASS")).toBe(true);
  });

  it("fails closed when audit lineage is corrupted", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      existingAuditLedger: Object.freeze([
        ...base.result.auditLedger,
        Object.freeze({
          ...base.result.auditLedger[0]!,
          previousHash: "tampered-previous-hash",
        }),
      ]),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_AUDIT_INCONSISTENCY")).toBe(true);
  });

  it("preserves immutable history across repeated freeze episodes", () => {
    const first = buildProposalFreezeFixture({
      recommendationReplayResult: Object.freeze({
        ...buildProposalFreezeFixture().input.recommendationReplayResult,
        status: "FROZEN" as const,
      }),
    });
    const second = buildProposalFreezeFixture({
      existingFreezeRecord: first.result.freezeRecord,
      existingFreezeEvents: first.result.freezeEvents,
      existingLineage: first.result.lineage,
      existingAuditLedger: first.result.auditLedger,
      recommendationReplayResult: Object.freeze({
        ...first.input.recommendationReplayResult,
        status: "FROZEN" as const,
      }),
    });

    expect(second.result.lineage.entries.length).toBeGreaterThan(first.result.lineage.entries.length);
    expect(second.result.lineage.entries.at(-1)?.freezeState).toBe(second.result.freezeRecord.freezeState);
    expect(second.result.freezeRecord.freezeId).toBe(first.result.freezeRecord.freezeId);
  });
});
