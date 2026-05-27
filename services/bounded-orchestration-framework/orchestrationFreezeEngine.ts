import type { BoundedOrchestrationContainmentState, BoundedOrchestrationState } from "@/types/bounded-orchestration-framework";

export function resolveBoundedOrchestrationState(input: {
  containmentState: BoundedOrchestrationContainmentState;
  failClosed: boolean;
  valid: boolean;
}): BoundedOrchestrationState {
  if (input.containmentState === "frozen" || input.containmentState === "fail_closed" || input.failClosed) {
    return "frozen";
  }
  if (!input.valid) {
    return "invalid";
  }
  if (input.containmentState === "restricted") {
    return "restricted";
  }
  return "strict_bounded";
}
