import type { DeterministicReplayError, DeterministicReplayInput, ReplayPolicyBinding } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function bindReplayPolicies(input: DeterministicReplayInput): {
  binding: ReplayPolicyBinding;
  errors: readonly DeterministicReplayError[];
} {
  const expected = input.recommendationLineageResult.policyLineage.policySnapshotId;
  const policyValidated = input.request.policySnapshotIds.includes(expected);
  const binding = Object.freeze({
    policySnapshotIds: Object.freeze([...input.request.policySnapshotIds]),
    policyValidated,
    policyHash: hashReplayValue("replay-policy-binding", {
      policySnapshotIds: input.request.policySnapshotIds,
      expected,
      policyValidated,
    }),
  }) satisfies ReplayPolicyBinding;

  return Object.freeze({
    binding,
    errors: policyValidated
      ? Object.freeze([])
      : Object.freeze([{
        code: "DETERMINISTIC_REPLAY_POLICY_MISMATCH" as const,
        message: "Replay policy snapshot set does not preserve historical policy ancestry.",
        path: "request.policySnapshotIds",
      }]),
  });
}
