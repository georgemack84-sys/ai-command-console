import type {
  AntiEmergenceError,
  AntiEmergenceInput,
  EmergenceReplayBinding,
} from "./antiEmergenceStateTypes";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function validateEmergenceReplayBinding(input: AntiEmergenceInput): {
  replayBinding: EmergenceReplayBinding;
  errors: readonly AntiEmergenceError[];
} {
  const replayBound = input.constitutionalReplayResult.record.replayDeterministic;
  const governanceBound = input.constitutionalReplayResult.replayBinding.governanceBound;
  const supremacyBound = input.humanSupremacyResult.record.governanceBound && input.humanSupremacyResult.record.replaySafe;
  const escalationBound = !input.escalationDeterminismResult.record.failClosed;
  const containmentBound = !input.humanSupremacyResult.record.failClosed && !input.constitutionalReplayResult.record.failClosed;
  const authorityBound = input.constitutionalAuthorityBoundaryResult.record.governanceBound && input.constitutionalAuthorityBoundaryResult.record.replaySafe;
  const errors: AntiEmergenceError[] = [];
  if (!replayBound || !governanceBound || !supremacyBound || !escalationBound || !authorityBound) {
    errors.push(Object.freeze({
      code: "ANTI_EMERGENCE_REPLAY_MISMATCH",
      message: "Anti-emergence containment requires replay-, governance-, supremacy-, authority-, and escalation-bound evidence.",
      path: "constitutionalReplayResult.replayBinding",
    }));
  }
  return Object.freeze({
    replayBinding: Object.freeze({
      bindingId: hashEmergenceValue("anti-emergence-replay-binding-id", input.containmentId),
      replayBound,
      governanceBound,
      supremacyBound,
      escalationBound,
      containmentBound,
      deterministicHash: hashEmergenceValue("anti-emergence-replay-binding", {
        containmentId: input.containmentId,
        replayBound,
        governanceBound,
        supremacyBound,
        escalationBound,
        containmentBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
