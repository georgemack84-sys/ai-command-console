import type { DeterministicReplayForensics } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function buildReplayForensics(input: {
  replayId: string;
  replayHash: string;
  evidenceHash: string;
  lineageHash: string;
}): DeterministicReplayForensics {
  return Object.freeze({
    exportId: hashReplayValue("deterministic-replay-forensics-id", {
      replayId: input.replayId,
    }),
    replayId: input.replayId,
    replayHash: input.replayHash,
    evidenceHash: input.evidenceHash,
    lineageHash: input.lineageHash,
    exportHash: hashReplayValue("deterministic-replay-forensics", input),
  });
}
