import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity determinism unit", () => {
  it("identical proposals produce identical hashes", () => {
    const first = buildProposalIntegrityFixture();
    const second = buildProposalIntegrityFixture();
    expect(first.result.proposal.proposalHash).toBe(second.result.proposal.proposalHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
