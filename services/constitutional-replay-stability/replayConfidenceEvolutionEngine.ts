import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  ReplayConfidenceEvolution,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function reconstructReplayConfidenceEvolution(input: ConstitutionalReplayStabilityInput): {
  confidence: ReplayConfidenceEvolution;
  errors: readonly ConstitutionalReplayStabilityError[];
} {
  const rawVolatility = input.metadata?.confidenceVolatilityScore ?? input.metadata?.telemetryConfidenceVolatilityScore ?? 0;
  const volatility = typeof rawVolatility === "number" ? rawVolatility : 0;
  const previous = 1;
  const current = Number((1 - volatility).toFixed(4));
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (volatility > 0 || normalized.includes("confidencecorruption") || normalized.includes("confidencespoofing")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_CONFIDENCE_CORRUPTION",
      message: "Confidence evolution diverged or corruption markers were detected.",
      path: volatility > 0 ? "telemetry.metrics.confidence_volatility_score" : "metadata",
    }));
  }
  const confidence: ReplayConfidenceEvolution = Object.freeze({
    replayId: input.replayId,
    confidenceScore: current,
    previousConfidenceScore: previous,
    volatilityDetected: volatility > 0,
    confidenceHash: hashReplayStabilityValue("constitutional-replay-stability-confidence", {
      replayId: input.replayId,
      current,
      previous,
      volatility,
    }),
  });
  return Object.freeze({
    confidence,
    errors: Object.freeze(errors),
  });
}
