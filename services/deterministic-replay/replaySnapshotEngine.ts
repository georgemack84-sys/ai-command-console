import type { DeterministicReplayInput, DeterministicReplaySnapshot, ReplayResult } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function buildDeterministicReplaySnapshot(input: {
  replayInput: DeterministicReplayInput;
  result: ReplayResult;
  graphHash: string;
}): DeterministicReplaySnapshot {
  return Object.freeze({
    snapshotId: hashReplayValue("deterministic-replay-snapshot-id", {
      replayId: input.result.replayId,
      recommendationId: input.result.recommendationId,
    }),
    replayId: input.result.replayId,
    recommendationId: input.result.recommendationId,
    replayHash: input.result.replayHash,
    graphHash: input.graphHash,
    snapshotHash: hashReplayValue("deterministic-replay-snapshot", {
      replayId: input.result.replayId,
      recommendationId: input.result.recommendationId,
      replayHash: input.result.replayHash,
      graphHash: input.graphHash,
      generatedAt: input.replayInput.generatedAt,
    }),
  });
}
