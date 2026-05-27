import { validateGovernanceBindingDeterminism } from "@/services/proposal-governance-binding/governanceBindingDeterminismValidator";
import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("governanceBindingDeterminismValidator", () => {
  it("keeps serialization and hashing stable across identical inputs", () => {
    const fixture = buildProposalGovernanceBindingFixture();
    const errors = validateGovernanceBindingDeterminism({
      binding: fixture.result.binding,
      snapshot: fixture.result.snapshot,
      lineageEvents: fixture.result.lineageEvents,
      auditRecords: fixture.result.auditRecords,
    });

    expect(errors).toHaveLength(0);
    expect(buildProposalGovernanceBindingFixture().result.deterministicHash).toBe(fixture.result.deterministicHash);
  });
});
