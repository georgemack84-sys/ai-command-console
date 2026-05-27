import type { HumanCoordinationOverrideState } from "@/types/human-coordination-override";

export function resolvePausedOverrideState(): HumanCoordinationOverrideState {
  return "paused";
}
