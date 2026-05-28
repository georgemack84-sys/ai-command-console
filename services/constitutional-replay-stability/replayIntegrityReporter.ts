import type {
  ConstitutionalReplayStabilityError,
  ReplayIntegrityReport,
  ReplayStabilityClassification,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function buildReplayIntegrityReport(input: {
  replayId: string;
  classification: ReplayStabilityClassification;
  errors: readonly ConstitutionalReplayStabilityError[];
  replayDeterministic: boolean;
}): ReplayIntegrityReport {
  const driftDetected = input.errors.some((item) => item.code.includes("DRIFT"));
  const reasons = Object.freeze(input.errors.map((item) => item.code));
  return Object.freeze({
    reportId: hashReplayStabilityValue("constitutional-replay-stability-report-id", input.replayId),
    replayId: input.replayId,
    classification: input.classification,
    driftDetected,
    replayDeterministic: input.replayDeterministic,
    reasons,
    reportHash: hashReplayStabilityValue("constitutional-replay-stability-report", {
      replayId: input.replayId,
      classification: input.classification,
      driftDetected,
      replayDeterministic: input.replayDeterministic,
      reasons,
    }),
  });
}
