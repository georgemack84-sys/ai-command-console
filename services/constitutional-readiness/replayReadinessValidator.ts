import type { ConstitutionalReadinessInput, ReadinessError, ReplayReadinessRecord } from "@/types/constitutional-readiness";
import { normalizeReadinessMetadata } from "./readinessContracts";
import { hashReadinessValue } from "./readinessHashEngine";

export function validateReplayReadiness(input: ConstitutionalReadinessInput): {
  record: ReplayReadinessRecord;
  errors: readonly ReadinessError[];
} {
  const normalized = normalizeReadinessMetadata(input.metadata);
  const telemetryReplayScore = input.adversarialTelemetryResult.metrics.replay_stability_score;
  const errors: ReadinessError[] = [];

  if (!input.adversarialTelemetryResult.record.replaySafe || telemetryReplayScore < 1) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_REPLAY_DIVERGENCE",
      message: "Replay safety or replay stability degraded below constitutional readiness requirements.",
      path: "adversarialTelemetryResult.metrics.replay_stability_score",
    }));
  }
  if (
    normalized.includes("replaycorruption")
    || normalized.includes("replayrepair")
    || normalized.includes("lateststatesubstitution")
    || normalized.includes("currentstatesubstitution")
    || normalized.includes("inferredlineage")
  ) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_READINESS_REPLAY_INTEGRITY_FAILURE",
      message: "Replay corruption, repair, substitution, or inferred lineage markers were detected.",
      path: "metadata",
    }));
  }

  const record: ReplayReadinessRecord = Object.freeze({
    readinessId: input.readinessId,
    replayScore: telemetryReplayScore,
    replaySafe: errors.length === 0,
    verificationHash: hashReadinessValue("constitutional-readiness-replay-record", {
      readinessId: input.readinessId,
      replayScore: telemetryReplayScore,
      errors: errors.map((item) => item.code),
    }),
  });

  return Object.freeze({
    record,
    errors: Object.freeze(errors),
  });
}
