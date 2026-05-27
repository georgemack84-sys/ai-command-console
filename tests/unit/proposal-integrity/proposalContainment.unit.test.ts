import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity containment unit", () => {
  it("keeps proposals advisory-only", () => {
    const fixture = buildProposalIntegrityFixture();
    expect(fixture.result.proposal.advisoryOnly).toBe(true);
    expect(fixture.result.proposal.executable).toBe(false);
  });
});
