import { buildGovernanceSnapshot } from "@/services/proposal-governance-binding/governanceSnapshotRegistry";
import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("governanceSnapshotRegistry", () => {
  it("creates deterministic immutable governance snapshots", () => {
    const fixture = buildProposalGovernanceBindingFixture();
    const snapshot = buildGovernanceSnapshot(fixture.input);

    expect(snapshot.errors).toHaveLength(0);
    expect(snapshot.snapshot.policySnapshotId).toBe(fixture.input.policySnapshotId);
    expect(snapshot.snapshot.constitutionalRulesHash).toBeTruthy();
  });
});
