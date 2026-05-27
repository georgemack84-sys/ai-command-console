import type { LifecycleError, LifecycleReplayBinding, LifecycleTransitionRequest } from "@/types/lifecycle";
import { createLifecycleError } from "./lifecycleBoundaryGuards";

export function validateLifecycleReplayIntegrity(input: {
  request: LifecycleTransitionRequest;
  replayBinding: LifecycleReplayBinding;
}): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];
  const lastEntry = input.request.existingLineage?.entries.at(-1);
  const hasProvidedLineage = input.request.existingLineage !== undefined;

  if (!input.replayBinding.valid) {
    errors.push(createLifecycleError(
      "LIFECYCLE_REPLAY_MISMATCH",
      "Lifecycle replay binding is invalid.",
      "replayBinding",
    ));
  }

  if (lastEntry && lastEntry.toState !== input.request.currentState) {
    errors.push(createLifecycleError(
      "LIFECYCLE_REPLAY_GAP_REJECTED",
      "Lifecycle chronology contains a replay continuity gap.",
      "existingLineage",
    ));
  }

  if (hasProvidedLineage && !lastEntry) {
    errors.push(createLifecycleError(
      "LIFECYCLE_REPLAY_GAP_REJECTED",
      "Lifecycle chronology must not provide an empty lineage placeholder.",
      "existingLineage.entries",
    ));
  }

  if (input.request.currentRecord.governanceDecision === "DENY" && input.request.nextState !== "review") {
    errors.push(createLifecycleError(
      "LIFECYCLE_REPLAY_MISMATCH",
      "Denied lifecycle records may not be replayed into a new forward state without explicit review re-entry.",
      "currentRecord.governanceDecision",
    ));
  }

  return Object.freeze(errors);
}
