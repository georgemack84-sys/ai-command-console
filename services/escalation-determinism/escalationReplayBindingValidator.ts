import type {
  EscalationDeterminismError,
  EscalationDeterminismInput,
  EscalationReplayBinding,
} from "./escalationStateTypes";
import { hashEscalationValue } from "./escalationHashingEngine";

export function validateEscalationReplayBinding(input: EscalationDeterminismInput): {
  replayBinding: EscalationReplayBinding;
  errors: readonly EscalationDeterminismError[];
} {
  const replay = input.constitutionalReplayResult;
  const authority = input.constitutionalAuthorityBoundaryResult;
  const supremacy = input.humanSupremacyResult;
  const replayBound = replay.record.replayDeterministic;
  const governanceBound = replay.replayBinding.governanceBound && supremacy.record.governanceBound;
  const authorityBound = authority.record.governanceBound && authority.record.replaySafe;
  const supremacyBound = supremacy.record.replaySafe && supremacy.record.governanceBound;
  const containmentBound = !supremacy.record.failClosed && !replay.record.failClosed;
  const errors: EscalationDeterminismError[] = [];
  if (!replayBound || !governanceBound || !authorityBound || !supremacyBound) {
    errors.push(Object.freeze({
      code: "ESCALATION_DETERMINISM_REPLAY_MISMATCH",
      message: "Escalation determinism requires replay-, governance-, authority-, and supremacy-bound historical evidence.",
      path: "constitutionalReplayResult.replayBinding",
    }));
  }
  return Object.freeze({
    replayBinding: Object.freeze({
      bindingId: hashEscalationValue("escalation-replay-binding-id", input.escalationId),
      replayBound,
      governanceBound,
      authorityBound,
      supremacyBound,
      containmentBound,
      deterministicHash: hashEscalationValue("escalation-replay-binding", {
        escalationId: input.escalationId,
        replayBound,
        governanceBound,
        authorityBound,
        supremacyBound,
        containmentBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
