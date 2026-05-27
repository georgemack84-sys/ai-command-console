import type { ConstitutionalCoordinationState } from "@/types/constitutional-coordination";

export function buildCoordinationLifecycleSummary(state: ConstitutionalCoordinationState): readonly string[] {
  if (state === "coordinated") {
    return Object.freeze(["created", "validated", "governance_bound", "replay_bound", "escalation_bound", "coordinated"]);
  }
  if (state === "restricted") {
    return Object.freeze(["created", "validated", "restricted"]);
  }
  if (state === "frozen") {
    return Object.freeze(["created", "frozen"]);
  }
  if (state === "invalid") {
    return Object.freeze(["created", "invalid"]);
  }
  return Object.freeze(["created", state]);
}
