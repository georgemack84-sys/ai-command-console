import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay reconstruction", () => {
  it("reconstructs proposal history with original governance, approvals, dependencies, and authority", () => {
    const fixture = buildProposalReplayFixture();

    expect(fixture.result.replay.proposalSnapshotId).toBe(fixture.input.proposalIntegrityResult.snapshot.snapshotId);
    expect(fixture.result.replay.reconstructedApprovals).toContain(fixture.input.proposalGovernanceBindingResult.approvalRequirementBinding.approvalRequirementSetId);
    expect(fixture.result.replay.reconstructedAuthority[0]).toBe(fixture.input.proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId);
  });
});
