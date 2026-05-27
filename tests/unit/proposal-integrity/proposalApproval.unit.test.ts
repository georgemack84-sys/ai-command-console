import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity approval unit", () => {
  it("preserves approval dependencies", () => {
    const fixture = buildProposalIntegrityFixture();
    expect(fixture.result.proposal.approvalDependencyIds.length).toBeGreaterThan(0);
  });
});
