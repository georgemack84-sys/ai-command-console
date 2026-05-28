import type { ConstitutionalReplayAttackInput, ConstitutionalReplayError } from "@/types/constitutional-replay";

export function verifyReplayDeterminism(input: ConstitutionalReplayAttackInput): Readonly<{
  deterministic: boolean;
  errors: readonly ConstitutionalReplayError[];
}> {
  const errors: ConstitutionalReplayError[] = [];
  if (!input.deterministicSeed) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_FAIL_CLOSED",
      message: "Deterministic replay seed is required for constitutional replay attack simulation.",
      path: "deterministicSeed",
    }));
  }
  return Object.freeze({
    deterministic: errors.length === 0,
    errors: Object.freeze(errors),
  });
}
