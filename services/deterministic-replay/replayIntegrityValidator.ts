import type {
  DeterministicReplayError,
  ReplayGovernanceBinding,
  ReplayPolicyBinding,
  ReplayScoringRecord,
  ReplayConfidenceRecord,
  ReplaySuppressionRecord,
} from "./types/deterministicReplayTypes";

export function validateReplayIntegrity(input: {
  governanceBinding: ReplayGovernanceBinding;
  policyBinding: ReplayPolicyBinding;
  scoring: ReplayScoringRecord;
  confidence: ReplayConfidenceRecord;
  suppression: ReplaySuppressionRecord;
  reconstructedRecommendationHash: string;
  originalRecommendationHash: string;
}): readonly DeterministicReplayError[] {
  const errors: DeterministicReplayError[] = [];
  if (!input.governanceBinding.governanceValidated) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_GOVERNANCE_MISMATCH",
      message: "Replay governance integrity check failed.",
      path: "governanceBinding",
    });
  }
  if (!input.policyBinding.policyValidated) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_POLICY_MISMATCH",
      message: "Replay policy integrity check failed.",
      path: "policyBinding",
    });
  }
  if (!input.suppression.suppressionValidated) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_SUPPRESSION_MISMATCH",
      message: "Replay suppression integrity check failed.",
      path: "suppression",
    });
  }
  if (input.reconstructedRecommendationHash !== input.originalRecommendationHash) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_HASH_MISMATCH",
      message: "Reconstructed recommendation hash diverged from historical original hash.",
      path: "reconstructedRecommendationHash",
    });
  }
  if (!Number.isFinite(input.scoring.reconstructedScore)) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_SCORING_MISMATCH",
      message: "Replay scoring reconstruction produced an invalid score.",
      path: "scoring",
    });
  }
  if (input.confidence.confidenceScore < 0 || input.confidence.confidenceScore > 1) {
    errors.push({
      code: "DETERMINISTIC_REPLAY_CONFIDENCE_MISMATCH",
      message: "Replay confidence reconstruction produced an invalid confidence score.",
      path: "confidence",
    });
  }
  return Object.freeze(errors);
}
