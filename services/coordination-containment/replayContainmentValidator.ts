import type { CoordinationContainmentInput } from "@/types/coordination-containment";

export function validateReplayContainment(input: CoordinationContainmentInput): readonly string[] {
  const errors: string[] = [];
  if (input.freshnessEvaluation.state.replayIntegrity !== "verified") {
    errors.push("freshness-replay-integrity");
  }
  if (!input.freshnessEvaluation.replayRevalidation.replaySafe) {
    errors.push("freshness-replay-unsafe");
  }
  if (!input.escalationRecord.decision.replaySafe) {
    errors.push("escalation-replay-unsafe");
  }
  if (input.missionGraph.visibilityState === "frozen") {
    errors.push("mission-graph-frozen");
  }
  if (input.missionGraph.replayPaths.length === 0) {
    errors.push("missing-replay-paths");
  }
  return Object.freeze(errors);
}
