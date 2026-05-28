import { createNormalizationError } from "./normalization-errors";
import type { NormalizePlanFailure, NormalizePlanInput } from "./normalization-types";

export function normalizeReplayMetadata(input: NormalizePlanInput): {
  replaySnapshot: NormalizePlanInput["replaySnapshot"];
} | NormalizePlanFailure {
  if (input.validationResult.evidence.replaySnapshot.graphHash !== input.replaySnapshot.graphHash) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_REPLAY_MISMATCH",
        "Replay snapshot graph hash does not match 4.2B validation evidence.",
      ),
    };
  }

  if (JSON.stringify(input.validationResult.evidence.replaySnapshot) !== JSON.stringify(input.replaySnapshot)) {
    return {
      ok: false,
      error: createNormalizationError(
        "PLAN_NORMALIZATION_REPLAY_MISMATCH",
        "Replay snapshot semantics diverged from 4.2B validation evidence.",
      ),
    };
  }

  return {
    replaySnapshot: input.replaySnapshot,
  };
}

