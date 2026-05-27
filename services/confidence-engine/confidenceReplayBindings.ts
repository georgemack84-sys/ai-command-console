import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceReplayBinding,
  DeterministicConfidenceInput,
} from "./types/confidenceTypes";

export function buildConfidenceReplayBinding(
  input: DeterministicConfidenceInput,
  admissible: boolean,
): ConfidenceReplayBinding {
  const core = {
    replayBindingId: `confidence-replay-binding:${input.proposalReplayResult.replay.replayId}`,
    proposalId: input.proposalIntegrityResult.proposal.proposalId,
    replayId: input.proposalReplayResult.replay.replayId,
    replayLineageId: input.proposalReplayResult.lineage.replayLineageHash,
    replayHash: input.proposalReplayResult.replay.replayHash,
    admissible,
  };

  return Object.freeze({
    ...core,
    bindingHash: hashConfidenceValue("confidence-replay-binding", core),
  });
}
