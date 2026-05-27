import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity fail closed", () => {
  it("proposal mutation after sealing is rejected", () => {
    const base = buildProposalIntegrityFixture();
    const mutated = buildProposalIntegrityFixture({
      existingSealedProposal: base.result.sealedRecord,
      metadata: Object.freeze({ mutationAfterSeal: true }),
    });
    expect(mutated.result.errors.some((error) => error.code === "PROPOSAL_MUTATION_AFTER_SEAL_BLOCKED")).toBe(true);
  });
});
