import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity determinism", () => {
  it("identical proposals produce identical hashes", () => {
    const first = buildProposalIntegrityFixture();
    const second = buildProposalIntegrityFixture();
    expect(first.result.proposal.proposalHash).toBe(second.result.proposal.proposalHash);
    expect(first.result.proposal.replayHash).toBe(second.result.proposal.replayHash);
    expect(first.result.proposal.auditHash).toBe(second.result.proposal.auditHash);
  });
});
