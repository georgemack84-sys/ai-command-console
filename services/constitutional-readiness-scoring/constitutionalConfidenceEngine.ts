import type {
  ConstitutionalConfidenceRecord,
  ConstitutionalReadinessInput,
  ReadinessDomainScore,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function computeReadinessConfidence(input: {
  readinessInput: ConstitutionalReadinessInput;
  domainScores: readonly ReadinessDomainScore[];
}): ConstitutionalConfidenceRecord {
  const total = input.domainScores.reduce((sum, score) => sum + score.score, 0);
  const confidenceScore = Number((total / input.domainScores.length).toFixed(4));

  return Object.freeze({
    readinessId: input.readinessInput.readinessId,
    confidenceScore,
    confidenceHash: hashReadinessValue("constitutional-readiness-confidence", {
      readinessId: input.readinessInput.readinessId,
      confidenceScore,
      scoreHashes: input.domainScores.map((score) => score.deterministicHash),
    }),
  });
}
