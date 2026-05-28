import type { ConstitutionalTransition } from "./types/constitutionalTransitionTypes";
import { CONSTITUTIONAL_TRANSITION_POLICY } from "./constitutionalTransitionPolicy";

export function getDeclaredTransitionTargets(
  entityType: ConstitutionalTransition["entityType"],
  sourceState: string,
): readonly string[] {
  return CONSTITUTIONAL_TRANSITION_POLICY[entityType][sourceState] ?? Object.freeze([]);
}
