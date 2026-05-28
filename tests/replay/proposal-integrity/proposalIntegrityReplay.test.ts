import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity replay", () => {
  it("replay substitution fails closed", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ replaySubstitution: true, replayDrift: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REPLAY_DRIFT_DETECTED")).toBe(true);
  });
});
