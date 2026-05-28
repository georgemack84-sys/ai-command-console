import type {
  RuntimeAdmissibilityInput,
  RuntimeReadinessScore,
  RuntimeSimulationSignal,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

export function scoreRuntimeReadiness(input: {
  admissibilityInput: RuntimeAdmissibilityInput;
  signals: readonly RuntimeSimulationSignal[];
}): RuntimeReadinessScore {
  const penalty = input.signals.reduce((total, signal) => {
    if (!signal.triggered) {
      return total;
    }
    switch (signal.severity) {
      case "critical":
        return total + 20;
      case "high":
        return total + 12;
      case "moderate":
        return total + 6;
      default:
        return total;
    }
  }, 0);
  const score = Math.max(0, 100 - penalty);
  const restrictionLevel = score === 100 ? "none" : score >= 70 ? "elevated" : "frozen";
  return Object.freeze({
    admissibilityId: input.admissibilityInput.admissibilityId,
    score,
    restrictionLevel,
    scoreHash: hashRuntimeCertificationValue("runtime-admissibility-score", {
      admissibilityId: input.admissibilityInput.admissibilityId,
      score,
      restrictionLevel,
    }),
  });
}
