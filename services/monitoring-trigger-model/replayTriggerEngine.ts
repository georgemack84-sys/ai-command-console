import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { MonitoringTrigger, TriggerReplayBinding } from "@/types/monitoring-trigger-model";
import { hashTriggerValue } from "./triggerHasher";

export function deriveReplayTrigger(input: {
  replay: ReplayReconstructionResult;
  replayBinding: TriggerReplayBinding;
  confidenceScore: number;
  governanceBindings: readonly string[];
  overrideBindings: readonly string[];
  createdAt: string;
}): MonitoringTrigger | undefined {
  if (input.replayBinding.valid && input.replay.status === "RECONSTRUCTED") {
    return undefined;
  }

  const severity = input.replay.status === "DRIFT_DETECTED" ? "critical" : "high";
  return Object.freeze({
    triggerId: hashTriggerValue("monitoring-trigger-replay-id", {
      replayHash: input.replay.reconstructionHash,
      replayStatus: input.replay.status,
      createdAt: input.createdAt,
    }),
    triggerType: "replay",
    severity,
    cautionState: "frozen-recommended",
    confidenceScore: input.confidenceScore,
    replayBindings: Object.freeze([
      input.replayBinding.reconstructionHash,
      input.replayBinding.replayLineageHash,
      input.replayBinding.snapshotLineageHash,
    ]),
    governanceBindings: input.governanceBindings,
    overrideBindings: input.overrideBindings,
    evidenceHashes: Object.freeze([
      hashTriggerValue("monitoring-trigger-replay-evidence", input.replay.status),
      hashTriggerValue("monitoring-trigger-replay-lineage", input.replayBinding.replayLineageHash),
    ]),
    lineageHash: input.replayBinding.overrideLineageHash,
    createdAt: input.createdAt,
  });
}
