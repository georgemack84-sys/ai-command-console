import type { DeterministicReplayError, DeterministicReplayInput, ReplayValidatorBinding } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function resolveReplayValidatorVersions(input: DeterministicReplayInput): {
  binding: ReplayValidatorBinding;
  errors: readonly DeterministicReplayError[];
} {
  const validatorValidated = input.request.validatorSnapshotIds.includes(input.validatorVersionId);
  const binding = Object.freeze({
    validatorSnapshotIds: Object.freeze([...input.request.validatorSnapshotIds]),
    validatorValidated,
    validatorHash: hashReplayValue("replay-validator-binding", {
      validatorSnapshotIds: input.request.validatorSnapshotIds,
      validatorVersionId: input.validatorVersionId,
      validatorValidated,
    }),
  }) satisfies ReplayValidatorBinding;

  return Object.freeze({
    binding,
    errors: validatorValidated
      ? Object.freeze([])
      : Object.freeze([{
        code: "DETERMINISTIC_REPLAY_VALIDATOR_MISMATCH" as const,
        message: "Replay validator snapshot set does not contain the historical validator binding.",
        path: "request.validatorSnapshotIds",
      }]),
  });
}
