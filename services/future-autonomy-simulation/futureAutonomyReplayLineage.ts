import type {
  FutureAutonomyReplayLineage,
} from "@/types/future-autonomy";
import type { GovernanceDriftResult } from "@/types/governance-drift";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function buildFutureAutonomyReplayLineage(input: {
  simulationId: string;
  governanceDriftResult: GovernanceDriftResult;
  replaySafe: boolean;
}): FutureAutonomyReplayLineage {
  const replaySourceId = input.governanceDriftResult.record.driftId;
  return Object.freeze({
    replayLineageId: hashFutureAutonomyValue("future-autonomy-replay-lineage-id", {
      simulationId: input.simulationId,
      replaySourceId,
    }),
    replaySourceId,
    replaySafe: input.replaySafe,
    replayHash: hashFutureAutonomyValue("future-autonomy-replay-lineage", {
      replaySourceId,
      replaySafe: input.replaySafe,
    }),
  });
}
