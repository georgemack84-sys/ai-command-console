import { buildProposalStateEngineFixture } from "@/tests/integration/proposal-state-engine/helpers";

describe("proposalStateEngine", () => {
  it("accepts valid transitions", () => {
    const fixture = buildProposalStateEngineFixture();

    expect(fixture.result.status).toBe("COMPLETED");
    expect(fixture.result.transitionResult.accepted).toBe(true);
    expect(fixture.result.transitionResult.resultingState).toBe("validated");
  });

  it("rejects illegal transitions", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        targetState: "approved",
      },
    });

    expect(fixture.result.transitionResult.accepted).toBe(false);
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_TARGET_ILLEGAL")).toBe(true);
  });

  it("rejects inferred transitions", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        reason: "Automatically infer readiness and approve without review.",
        targetState: "approved",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_AMBIGUOUS_TRANSITION")).toBe(true);
    expect(fixture.result.transitionResult.accepted).toBe(false);
  });

  it("rejects source mismatch", () => {
    const fixture = buildProposalStateEngineFixture({
      currentState: "validated",
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_SOURCE_MISMATCH")).toBe(true);
  });

  it("rejects replay lineage drift", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        replayLineageId: "replay-lineage-drift",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_REPLAY_LINEAGE_MISSING")).toBe(true);
  });

  it("rejects governance mismatch", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        governanceSnapshotId: "governance-snapshot-drift",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_GOVERNANCE_BINDING_MISSING")).toBe(true);
  });

  it("rejects approval lineage mutation", () => {
    const base = buildProposalStateEngineFixture();
    const fixture = buildProposalStateEngineFixture({
      currentState: "reviewed",
      transition: {
        ...base.input.transition,
        sourceState: "reviewed",
        targetState: "approved",
        approvalLineageId: "approval-lineage-mutated",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_APPROVAL_LINEAGE_MISSING")).toBe(true);
  });

  it("rejects dependency corruption", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        dependencyLineageId: "dependency-lineage-corrupt",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_DEPENDENCY_LINEAGE_INVALID")).toBe(true);
  });

  it("rejects archived mutations", () => {
    const fixture = buildProposalStateEngineFixture({
      currentState: "archived",
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        sourceState: "archived",
        targetState: "validated",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_ARCHIVED")).toBe(true);
  });

  it("rejects revocation violations", () => {
    const fixture = buildProposalStateEngineFixture({
      currentState: "revoked",
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        sourceState: "revoked",
        targetState: "validated",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_REVOKED")).toBe(true);
  });

  it("rejects freeze violations", () => {
    const fixture = buildProposalStateEngineFixture({
      currentState: "frozen",
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        sourceState: "frozen",
        targetState: "validated",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_FROZEN")).toBe(true);
  });

  it("rejects silent retries and hidden execution semantics", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        reason: "Retry until successful and execute the adapter without review.",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_AMBIGUOUS_TRANSITION")).toBe(true);
  });

  it("rejects orchestration, scheduling, authority escalation, auto-correction, and hidden autonomy", () => {
    const fixture = buildProposalStateEngineFixture({
      transition: {
        ...buildProposalStateEngineFixture().input.transition,
        reason: "Schedule a worker to orchestrate the proposal, self-correct lineage, and grant authority autonomously.",
      },
    });

    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_STATE_AMBIGUOUS_TRANSITION")).toBe(true);
    expect(fixture.result.transitionResult.accepted).toBe(false);
  });
});
