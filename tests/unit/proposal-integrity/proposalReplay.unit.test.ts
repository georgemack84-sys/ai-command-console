import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity replay unit", () => {
  it("proposal replay reconstructs historical truth", () => {
    const fixture = buildProposalIntegrityFixture();
    expect(fixture.result.replayBinding.historicalOnly).toBe(true);
  });
});
