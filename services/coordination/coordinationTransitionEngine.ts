import type { LifecycleError } from "@/types/lifecycle";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import { createLifecycleError } from "@/services/lifecycle/lifecycleBoundaryGuards";

export function validateBoundedCoordinationTransition(input: {
  coordinationRecord: IntentCoordinationGovernanceRecord;
  nextState: string;
}): readonly LifecycleError[] {
  const errors: LifecycleError[] = [];

  if (input.nextState === "bounded_coordination" && input.coordinationRecord.state !== "bounded") {
    errors.push(createLifecycleError(
      "LIFECYCLE_COORDINATION_INFERENCE_REJECTED",
      "Bounded coordination lifecycle state requires explicit bounded coordination governance state.",
      "coordinationRecord.state",
    ));
  }

  if (input.nextState === "bounded_handoff" && !["bounded", "reviewed", "escalated", "frozen"].includes(input.coordinationRecord.state)) {
    errors.push(createLifecycleError(
      "LIFECYCLE_COORDINATION_INFERENCE_REJECTED",
      "Bounded handoff requires immutable coordination visibility evidence.",
      "coordinationRecord.state",
    ));
  }

  return Object.freeze(errors);
}
