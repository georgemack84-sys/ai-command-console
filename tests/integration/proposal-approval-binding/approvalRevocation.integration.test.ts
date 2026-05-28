import { describe, expect, it } from "vitest";
import { buildProposalApprovalBindingFixture } from "./helpers";

describe("proposal approval revocation propagation", () => {
  it("propagates revocation into approval admissibility and lineage", () => {
    const base = buildProposalApprovalBindingFixture();
    const fixture = buildProposalApprovalBindingFixture({
      proposalRevocationResult: {
        ...base.input.proposalRevocationResult,
        status: "REVOKED",
      },
    });

    expect(fixture.result.revocation?.revokedApprovalIds.length).toBeGreaterThan(0);
    expect(fixture.result.admissibility.status).toBe("REVOKED");
  });
});
