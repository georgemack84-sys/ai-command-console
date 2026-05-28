import { buildProposalFreezeFixture } from "@/tests/integration/proposal-freeze-layer/helpers";

describe("proposalFreezeEngine", () => {
  it("keeps stable proposals active with deterministic containment records", () => {
    const fixture = buildProposalFreezeFixture();

    expect(fixture.result.status).toBe("ACTIVE");
    expect(fixture.result.freezeRecord.freezeState).toBe("ACTIVE");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.freezeRecord.freezeReason).toBe("REPLAY_RECONSTRUCTION_FAILURE");
    expect(fixture.result.freezeEvents.map((event) => event.eventType)).toEqual([
      "FREEZE_VALIDATED",
      "FREEZE_AUDITED",
    ]);
    expect(fixture.result.freezeRecord.freezeHash).toBeTruthy();
  });

  it("freezes on replay drift", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      recommendationReplayResult: Object.freeze({
        ...base.input.recommendationReplayResult,
        status: "FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_REPLAY_DRIFT")).toBe(true);
  });

  it("permanently freezes on governance mismatch", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      proposalStateEngineInput: Object.freeze({
        ...base.input.proposalStateEngineInput,
        transition: Object.freeze({
          ...base.input.proposalStateEngineInput.transition,
          governanceSnapshotId: "governance-snapshot-drift",
        }),
      }),
    });

    expect(fixture.result.status).toBe("PERMANENTLY_FROZEN");
    expect(fixture.result.freezeRecord.freezeState).toBe("PERMANENTLY_FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_GOVERNANCE_MISMATCH")).toBe(true);
  });

  it("freezes on approval lineage instability", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      proposalStateEngineInput: Object.freeze({
        ...base.input.proposalStateEngineInput,
        transition: Object.freeze({
          ...base.input.proposalStateEngineInput.transition,
          approvalLineageId: "approval-lineage-mutated",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_APPROVAL_LINEAGE_INSTABILITY")).toBe(true);
  });

  it("freezes on dependency corruption", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      proposalStateEngineInput: Object.freeze({
        ...base.input.proposalStateEngineInput,
        transition: Object.freeze({
          ...base.input.proposalStateEngineInput.transition,
          dependencyLineageId: "dependency-lineage-corrupt",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_DEPENDENCY_CORRUPTION")).toBe(true);
  });

  it("fails closed on hidden execution, orchestration, scheduling, and authority semantics", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      metadata: Object.freeze({
        ...base.input.metadata,
        injectedReasoning: "Execute the adapter, orchestrate recovery, schedule retries, and expand authority.",
      }),
    });

    expect(fixture.result.status).toBe("PERMANENTLY_FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_HIDDEN_EXECUTION")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_HIDDEN_ORCHESTRATION")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_SCHEDULER_SEMANTIC")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_AUTHORITY_MISMATCH")).toBe(true);
  });

  it("blocks silent unfreeze and resurrection attempts", () => {
    const base = buildProposalFreezeFixture();
    const fixture = buildProposalFreezeFixture({
      existingFreezeRecord: Object.freeze({
        ...base.result.freezeRecord,
        freezeState: "FROZEN" as const,
      }),
      metadata: Object.freeze({
        requestedAction: "unfreeze and resurrect proposal immediately",
      }),
    });

    expect(fixture.result.status).toBe("PERMANENTLY_FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_FREEZE_UNFREEZE_ATTEMPT")).toBe(true);
  });

  it("preserves append-only audit and immutable authority flags", () => {
    const first = buildProposalFreezeFixture();
    const second = buildProposalFreezeFixture({
      existingAuditLedger: first.result.auditLedger,
      existingLineage: first.result.lineage,
    });

    expect(second.result.auditLedger.length).toBeGreaterThan(first.result.auditLedger.length);
    expect(second.result.auditLedger[first.result.auditLedger.length]?.previousHash)
      .toBe(first.result.auditLedger.at(-1)?.entryHash);
    expect(second.result.auditRecords.every((record) =>
      record.executionAuthorized === false
      && record.runtimeMutationOccurred === false
      && record.scheduledActionCreated === false
      && record.authorityChanged === false
      && record.operatorReviewRequired === true,
    )).toBe(true);
  });

  it("produces deterministic hashes for identical inputs", () => {
    const first = buildProposalFreezeFixture();
    const second = buildProposalFreezeFixture();

    expect(second.result.deterministicHash).toBe(first.result.deterministicHash);
    expect(second.result.freezeRecord.freezeHash).toBe(first.result.freezeRecord.freezeHash);
    expect(second.result.lineage.lineageHash).toBe(first.result.lineage.lineageHash);
  });
});
