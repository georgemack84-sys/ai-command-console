import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";

export function validateReplayGovernance(operationalIntent: OperationalIntentResolutionResult) {
  return {
    replaySafe: !operationalIntent.semanticGovernance.replayDriftDetected,
    blockedReasons: operationalIntent.semanticGovernance.replayDriftDetected ? ["REPLAY_DRIFT_DETECTED"] : [],
  };
}
