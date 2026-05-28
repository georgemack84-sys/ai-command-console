import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity unit", () => {
  it("valid proposal seals successfully", () => {
    const fixture = buildProposalIntegrityFixture();
    expect(fixture.result.sealedRecord.immutable).toBe(true);
    expect(fixture.result.proposal.executionAuthorized).toBe(false);
  });
});
