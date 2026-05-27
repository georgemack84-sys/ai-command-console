import { buildProposalRevocationFixture } from "@/tests/integration/proposal-revocation-engine/helpers";

describe("proposal revocation integration", () => {
  it("propagates multi-level revocation containment deterministically", () => {
    const fixture = buildProposalRevocationFixture();

    expect(fixture.result.status).toBe("CASCADE_COMPLETED");
    expect(fixture.result.propagation).toHaveLength(7);
    expect(fixture.result.propagation.every((record) => record.blocked === true)).toBe(true);
  });

  it("preserves immutable audit and replay reconstruction while revoked", () => {
    const fixture = buildProposalRevocationFixture();

    expect(fixture.result.replayPolicy.replayAdmissibleForAudit).toBe(true);
    expect(fixture.result.replayPolicy.executionRestorationBlocked).toBe(true);
    expect(fixture.result.auditEntries.at(-1)?.eventType).toBe("REVOCATION_COMPLETED");
    expect(fixture.result.lineage.lineageHash).toBeTruthy();
  });

  it("contains freeze plus revoke interaction without bypassing containment", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      proposalFreezeResult: Object.freeze({
        ...base.input.proposalFreezeResult,
        status: "PERMANENTLY_FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("CASCADE_COMPLETED");
    expect(fixture.result.invalidations.some((item) => item.category === "governance")).toBe(true);
  });

  it("fails closed on audit corruption", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      existingAuditLedger: Object.freeze([
        ...base.result.auditLedger,
        Object.freeze({
          ...base.result.auditLedger[0]!,
          previousHash: "tampered-previous-hash",
        }),
      ]),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_AUDIT_CORRUPTION")).toBe(true);
  });

  it("fails closed on historical truth conflict and proposal resurrection attempts", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      request: Object.freeze({
        ...base.input.request,
        proposalId: "other-proposal",
      }),
      metadata: Object.freeze({
        requestedAction: "revive proposal after revoke",
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_HISTORICAL_TRUTH_CONFLICT")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_RESURRECTION_ATTEMPT")).toBe(true);
  });
});
