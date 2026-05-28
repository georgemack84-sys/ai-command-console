import { canonicalizeConfidenceToString } from "./confidenceCanonicalizer";
import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  ConfidenceDeterminismCertification,
  DeterministicConfidenceError,
  DeterministicConfidenceScore,
  ReplayDrift,
} from "./types/confidenceTypes";

export function validateConfidenceReplay(input: {
  score: DeterministicConfidenceScore;
  certification: ConfidenceDeterminismCertification;
  drifts: readonly ReplayDrift[];
}): readonly DeterministicConfidenceError[] {
  const errors: DeterministicConfidenceError[] = [];
  const replayHash = hashConfidenceValue("confidence-replay-validation", canonicalizeConfidenceToString({
    score: input.score,
    drifts: input.drifts,
    certificationHash: input.certification.certificationHash,
  }));

  if (replayHash.length === 0) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_REPLAY_HASH_MISMATCH",
      message: "Confidence replay validation could not produce a deterministic replay hash.",
      path: "score",
    });
  }

  if (!input.certification.certified) {
    errors.push({
      code: "DETERMINISTIC_CONFIDENCE_REPLAY_NON_DETERMINISTIC",
      message: "Confidence replay determinism could not be certified.",
      path: "certification",
    });
  }

  return Object.freeze(errors);
}
