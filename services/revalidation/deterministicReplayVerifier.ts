import type { FreshnessError } from "@/types/freshness";
import { createFreshnessError } from "@/services/freshness/freshnessGuards";

export function verifyDeterministicReplay(input: {
  replayValid: boolean;
  lifecycleReplayHash: string;
  proposalReplayHash: string;
}): Readonly<{
  verified: boolean;
  reasonCodes: readonly string[];
  errors: readonly FreshnessError[];
}> {
  const verified = input.replayValid && input.lifecycleReplayHash === input.proposalReplayHash;
  return Object.freeze({
    verified,
    reasonCodes: Object.freeze(
      verified ? ["replay.verified"] : ["replay.mismatch"],
    ),
    errors: Object.freeze(
      verified ? [] : [createFreshnessError(
        "DRIFT_REPLAY_MISMATCH",
        "Replay revalidation detected immutable replay mismatch.",
        "replay",
      )],
    ),
  });
}
