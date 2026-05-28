import type { DeterministicReplayError, DeterministicReplayMetrics } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function buildReplayMetrics(input: {
  errors: readonly DeterministicReplayError[];
  certified: boolean;
  deterministic: boolean;
  governanceValidated: boolean;
  suppressionValidated: boolean;
}): DeterministicReplayMetrics {
  const metrics = {
    replayDuration: 0,
    replayDeterminismRate: input.deterministic ? 1 : 0,
    replayCertificationRate: input.certified ? 1 : 0,
    replayInvalidationFrequency: input.errors.length > 0 ? 1 : 0,
    governanceMismatchFrequency: input.errors.some((error) => error.code === "DETERMINISTIC_REPLAY_GOVERNANCE_MISMATCH") ? 1 : 0,
    suppressionMismatchFrequency: input.errors.some((error) => error.code === "DETERMINISTIC_REPLAY_SUPPRESSION_MISMATCH") ? 1 : 0,
    dependencyFailures: input.errors.some((error) => error.code.includes("DEPENDENCY") || error.code.includes("MISSING_SNAPSHOT")) ? 1 : 0,
    driftFrequency: input.errors.some((error) => error.code.includes("DRIFT") || error.code.includes("MISMATCH")) ? 1 : 0,
    metricsHash: "",
  };
  return Object.freeze({
    ...metrics,
    metricsHash: hashReplayValue("deterministic-replay-metrics", metrics),
  });
}
