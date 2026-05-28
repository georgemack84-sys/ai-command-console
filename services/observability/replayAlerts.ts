import type { ReplayDivergence } from "../contracts/replay/replayTypes";

export function evaluateReplayAlerts(divergences: ReplayDivergence[]) {
  return divergences
    .filter((divergence) => divergence.requiresEscalation)
    .map((divergence) => ({
      type: "replay.diverged",
      severity: divergence.severity,
      category: divergence.category,
      evidence: divergence.evidence,
    }));
}
