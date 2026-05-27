import { describe, expect, it } from "vitest";
import { simulateConstitutionalReplayAttack } from "@/services/constitutional-replay-attack";
import { buildConstitutionalReplayFixture } from "@/tests/integration/constitutional-replay/helpers";

describe("constitutionalReplayAttackHarness", () => {
  it("is deterministic for the same input", () => {
    const { input } = buildConstitutionalReplayFixture();
    const first = simulateConstitutionalReplayAttack(input);
    const second = simulateConstitutionalReplayAttack(input);

    expect(first.deterministicHash).toBe(second.deterministicHash);
    expect(first.record.replayAttackState).toBe("SIMULATED");
    expect(first.authorityContract.executionAuthority).toBe(false);
  });

  it("fails closed on validator substitution attacks", () => {
    const result = simulateConstitutionalReplayAttack(buildConstitutionalReplayFixture({
      metadata: Object.freeze({ validatorSubstitution: true }),
    }).input);

    expect(result.record.failClosed).toBe(true);
    expect(result.errors.some((item) => item.code === "CONSTITUTIONAL_REPLAY_VALIDATOR_MISMATCH")).toBe(true);
  });
});
