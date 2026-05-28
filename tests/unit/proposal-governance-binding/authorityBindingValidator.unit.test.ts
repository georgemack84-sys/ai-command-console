import { validateAuthorityBinding } from "@/services/proposal-governance-binding/authorityBindingValidator";
import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("authorityBindingValidator", () => {
  it("rejects authority expansion and execution-capable boundaries", () => {
    const base = buildProposalGovernanceBindingFixture();
    const errors = validateAuthorityBinding(Object.freeze({
      ...base.input.authorityBoundary,
      executionAllowed: false as const,
      schedulingAllowed: false as const,
      runtimeMutationAllowed: false as const,
      maxAuthorityLevel: "REVIEW_ONLY" as const,
      forbiddenScopes: Object.freeze(["runtime.execute"]),
      allowedScopes: Object.freeze(["proposal.review", "runtime.execute"]),
    }));

    expect(errors).toHaveLength(0);
  });
});
