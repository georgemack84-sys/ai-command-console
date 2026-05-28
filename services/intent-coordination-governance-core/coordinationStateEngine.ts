import type { CoordinationState } from "@/types/intent-coordination-governance-core";

export function deriveCoordinationStateHashMaterial(state: CoordinationState, requestedTransition: string) {
  return Object.freeze({
    state,
    requestedTransition,
    executionAuthority: false as const,
  });
}
