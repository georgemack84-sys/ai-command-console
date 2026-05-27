import type { EmergencyFreeze, HumanSupremacyState } from "@/types/human-supremacy";

export function resolveFreezeState(freeze?: EmergencyFreeze): HumanSupremacyState | undefined {
  return freeze ? "frozen" : undefined;
}
