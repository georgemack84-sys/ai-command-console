import { buildProposalRevocationFixture } from "@/tests/integration/proposal-revocation-engine/helpers";

describe("proposalRevocationEngine", () => {
  it("revokes valid proposals with a deterministic containment cascade", () => {
    const fixture = buildProposalRevocationFixture();

    expect(fixture.result.status).toBe("CASCADE_COMPLETED");
    expect(fixture.result.request.executionAuthorized).toBe(false);
    expect(fixture.result.invalidations.length).toBeGreaterThan(0);
    expect(fixture.result.lineage.proposalId).toBe(fixture.input.request.proposalId);
  });

  it("fails closed on governance mismatch", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      request: Object.freeze({
        ...base.input.request,
        governanceSnapshotId: "governance-snapshot-drift",
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_GOVERNANCE_MISMATCH")).toBe(true);
  });

  it("fails closed on replay ambiguity", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      recommendationReplayResult: Object.freeze({
        ...base.input.recommendationReplayResult,
        status: "FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_REPLAY_AMBIGUITY")).toBe(true);
  });

  it("fails closed on approval lineage failure", () => {
    const base = buildProposalRevocationFixture();
    const mutatedStateResult = Object.freeze({
      ...base.input.proposalStateEngineResult,
      lineage: Object.freeze({
        ...base.input.proposalStateEngineResult.lineage,
        approvalLineageIds: Object.freeze(["approval-lineage-mutated"]),
      }),
    }) as typeof base.input.proposalStateEngineResult;
    const fixture = buildProposalRevocationFixture({
      proposalStateEngineResult: mutatedStateResult,
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_APPROVAL_LINEAGE_INCOMPLETE")).toBe(true);
  });

  it("fails closed on dependency lineage corruption", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      request: Object.freeze({
        ...base.input.request,
        dependencySnapshotId: "dependency-lineage-corrupt",
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_DEPENDENCY_LINEAGE_INCOMPLETE")).toBe(true);
  });

  it("blocks execution, scheduling, orchestration, and authority restoration semantics", () => {
    const base = buildProposalRevocationFixture();
    const fixture = buildProposalRevocationFixture({
      metadata: Object.freeze({
        ...base.input.metadata,
        injected: "execute the adapter, schedule the recovery, orchestrate approval, restore authority",
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_EXECUTION_SEMANTIC")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_SCHEDULER_SEMANTIC")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_ORCHESTRATION_SEMANTIC")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_AUTHORITY_RESTORATION")).toBe(true);
  });

  it("blocks resurrection attempts", () => {
    const fixture = buildProposalRevocationFixture({
      metadata: Object.freeze({
        requestedAction: "resurrect and unrevoke proposal",
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REVOCATION_RESURRECTION_ATTEMPT")).toBe(true);
  });

  it("preserves append-only audit behavior and deterministic hashing", () => {
    const first = buildProposalRevocationFixture();
    const second = buildProposalRevocationFixture({
      existingAuditLedger: first.result.auditLedger,
      existingLineage: first.result.lineage,
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[first.result.auditLedger.length]?.previousHash)
      .toBe(first.result.auditLedger.at(-1)?.entryHash);
    expect(buildProposalRevocationFixture().result.deterministicHash).toBe(first.result.deterministicHash);
  });
});
