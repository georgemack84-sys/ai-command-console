import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";

describe("constitutional replay stability determinism", () => {
  it("produces identical replay hashes for identical input", () => {
    const first = buildConstitutionalReplayStabilityFixture();
    const second = buildConstitutionalReplayStabilityFixture();

    expect(first.result.replayState.deterministicHash).toBe(second.result.replayState.deterministicHash);
    expect(first.result.historicalGovernance.governanceHash).toBe(second.result.historicalGovernance.governanceHash);
  });
});
