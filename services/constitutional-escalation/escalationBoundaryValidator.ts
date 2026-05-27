import type { ConstitutionalCoordinationError, ConstitutionalEscalationBinding } from "@/types/constitutional-coordination";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function validateEscalationBoundary(binding: ConstitutionalEscalationBinding): readonly ConstitutionalCoordinationError[] {
  if (binding.replaySafe) {
    return Object.freeze([]);
  }
  return Object.freeze([
    createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_REPLAY_MISMATCH",
      "Escalation binding must remain replay-safe.",
      "escalationBinding.replaySafe",
    ),
  ]);
}
