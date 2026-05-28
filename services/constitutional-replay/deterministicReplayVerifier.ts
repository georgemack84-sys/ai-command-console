import type { ConstitutionalCoordinationError, ConstitutionalReplayBinding } from "@/types/constitutional-coordination";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function verifyDeterministicReplay(binding: ConstitutionalReplayBinding): readonly ConstitutionalCoordinationError[] {
  const errors: ConstitutionalCoordinationError[] = [];
  if (!binding.valid) {
    errors.push(createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_REPLAY_MISMATCH",
      "Replay binding is invalid and coordination cannot continue.",
      "replayBinding.valid",
    ));
  }
  if (!binding.deterministic) {
    errors.push(createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_REPLAY_AMBIGUITY",
      "Replay binding is not deterministic.",
      "replayBinding.deterministic",
    ));
  }
  return Object.freeze(errors);
}
