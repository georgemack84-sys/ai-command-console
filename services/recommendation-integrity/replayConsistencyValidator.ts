import type { RecommendationIntegrityError, RecommendationIntegrityInput } from "@/types/recommendation-integrity";

function error(
  code: RecommendationIntegrityError["code"],
  message: string,
  path?: string,
): RecommendationIntegrityError {
  return Object.freeze({ code, message, path });
}

export function validateRecommendationReplayConsistency(
  input: RecommendationIntegrityInput,
): readonly RecommendationIntegrityError[] {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const errors: RecommendationIntegrityError[] = [];
  if (input.attackResult.record.failClosed) {
    errors.push(error("RECOMMENDATION_REPLAY_INCONSISTENT", "Upstream attack replay was already fail-closed.", "attackResult.record.failClosed"));
  }
  if (serialized.includes("replayrepair") || serialized.includes("repairreplay")) {
    errors.push(error("RECOMMENDATION_REPLAY_REPAIR_ATTEMPT", "Replay repair attempts are forbidden.", "metadata"));
  }
  if (serialized.includes("replaycorruption") || serialized.includes("replaymutation")) {
    errors.push(error("RECOMMENDATION_REPLAY_INCONSISTENT", "Replay inconsistency or mutation markers were detected.", "metadata"));
  }
  if (
    serialized.includes("mutateruntime")
    || serialized.includes("executionimport")
    || serialized.includes("schedulerimport")
    || serialized.includes("orchestrationimport")
  ) {
    errors.push(error(
      "RECOMMENDATION_RUNTIME_MUTATION_ATTEMPT",
      "Runtime mutation or operational import markers were detected in recommendation simulation.",
      "metadata",
    ));
    errors.push(error(
      "RECOMMENDATION_ISOLATION_VIOLATION",
      "Recommendation isolation was violated by operational markers.",
      "metadata",
    ));
  }
  return Object.freeze(errors);
}
