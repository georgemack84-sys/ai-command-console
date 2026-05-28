import type {
  HumanSupremacyEnforcementInput,
  HumanSupremacyError,
  SupremacyReplayBinding,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function validateSupremacyReplayBinding(input: HumanSupremacyEnforcementInput): {
  replayBinding: SupremacyReplayBinding;
  errors: readonly HumanSupremacyError[];
} {
  const replay = input.constitutionalReplayResult;
  const governanceBound = replay.replayBinding.governanceBound;
  const replayBound = replay.replayBinding.replayBound && replay.record.replayDeterministic;
  const containmentBound = !replay.record.failClosed;
  const errors: HumanSupremacyError[] = [];
  if (!governanceBound || !replayBound) {
    errors.push(Object.freeze({
      code: "HUMAN_SUPREMACY_REPLAY_BINDING_INVALID",
      message: "Human supremacy enforcement requires governance-bound deterministic replay.",
      path: "constitutionalReplayResult.replayBinding",
    }));
  }
  return Object.freeze({
    replayBinding: Object.freeze({
      bindingId: hashSupremacyValue("human-supremacy-replay-binding-id", input.supremacyId),
      governanceBound,
      replayBound,
      containmentBound,
      deterministicHash: hashSupremacyValue("human-supremacy-replay-binding", {
        supremacyId: input.supremacyId,
        governanceBound,
        replayBound,
        containmentBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
