import { CONFIDENCE_WEIGHT_TABLE } from "./contracts/confidenceContracts";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type { ConfidenceFactorRecord, ConfidenceFactorType } from "./types/confidenceTypes";

export function getConfidenceWeights(): Readonly<Record<ConfidenceFactorType, number>> {
  return CONFIDENCE_WEIGHT_TABLE;
}

export function buildConfidenceFactor(input: {
  factorType: ConfidenceFactorType;
  score: number;
  reason: string;
}): ConfidenceFactorRecord {
  const weight = CONFIDENCE_WEIGHT_TABLE[input.factorType];
  const normalizedScore = Number(Math.max(0, Math.min(1, input.score)).toFixed(3));
  const weightedScore = Number((normalizedScore * weight).toFixed(3));

  return Object.freeze({
    factorType: input.factorType,
    score: normalizedScore,
    weight,
    weightedScore,
    reason: input.reason,
    deterministicHash: hashConfidenceValue("confidence-factor", {
      factorType: input.factorType,
      score: normalizedScore,
      weight,
      reason: input.reason,
    }),
  });
}
