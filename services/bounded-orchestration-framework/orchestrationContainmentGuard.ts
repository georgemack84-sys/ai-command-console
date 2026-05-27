import type { AntiEmergenceValidationResult } from "@/types/coordination-containment";
import type { BoundedOrchestrationCeiling, BoundedOrchestrationContainmentState } from "@/types/bounded-orchestration-framework";

export function inheritOrchestrationContainmentState(
  containmentState: AntiEmergenceValidationResult["containmentState"],
): BoundedOrchestrationContainmentState {
  if (containmentState === "safe") {
    return "safe";
  }
  if (containmentState === "restricted") {
    return "restricted";
  }
  if (containmentState === "frozen" || containmentState === "blocked" || containmentState === "disputed") {
    return "frozen";
  }
  return "fail_closed";
}

export function ceilingFromContainmentState(
  containmentState: BoundedOrchestrationContainmentState,
): BoundedOrchestrationCeiling {
  if (containmentState === "safe") {
    return "strict";
  }
  if (containmentState === "restricted") {
    return "restricted";
  }
  return "frozen";
}
