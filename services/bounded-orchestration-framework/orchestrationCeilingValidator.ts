import type { BoundedOrchestrationCeiling, BoundedOrchestrationContainmentState } from "@/types/bounded-orchestration-framework";
import { ceilingFromContainmentState } from "./orchestrationContainmentGuard";

export function validateOrchestrationCeiling(
  containmentState: BoundedOrchestrationContainmentState,
): BoundedOrchestrationCeiling {
  return ceilingFromContainmentState(containmentState);
}
