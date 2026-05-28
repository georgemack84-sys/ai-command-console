import { validatePolicyBinding } from "@/services/proposal-governance-binding/policyBindingValidator";
import { buildGovernanceSnapshot } from "@/services/proposal-governance-binding/governanceSnapshotRegistry";
import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("policyBindingValidator", () => {
  it("rejects latest-policy substitution and policy drift", () => {
    const base = buildProposalGovernanceBindingFixture();
    const snapshot = buildGovernanceSnapshot(base.input).snapshot;
    const errors = validatePolicyBinding({
      bindingInput: Object.freeze({
        ...base.input,
        policySnapshotId: "latest-policy",
        metadata: Object.freeze({ requestedAction: "float to latest policy" }),
      }),
      snapshot: Object.freeze({
        ...snapshot,
        policySnapshotId: "latest-policy",
      }),
    });

    expect(errors.some((error) => error.code === "PROPOSAL_GOVERNANCE_BINDING_GOVERNANCE_MIGRATION")).toBe(true);
  });
});
