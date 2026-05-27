import { hashConfidenceValue } from "./confidenceHashEngine";
import type {
  DeterministicConfidenceError,
  DeterministicConfidenceInput,
  ReplayDrift,
} from "./types/confidenceTypes";

export function validateConfidenceDrift(input: {
  engineInput: DeterministicConfidenceInput;
  errors: readonly DeterministicConfidenceError[];
}): readonly ReplayDrift[] {
  const drifts: ReplayDrift[] = [];

  const pushDrift = (
    driftType: ReplayDrift["driftType"],
    severity: ReplayDrift["severity"],
  ) => {
    drifts.push(Object.freeze({
      driftId: hashConfidenceValue("confidence-drift", {
        replayId: input.engineInput.proposalReplayResult.replay.replayId,
        driftType,
        severity,
      }),
      replayId: input.engineInput.proposalReplayResult.replay.replayId,
      driftType,
      severity,
      detectedAt: input.engineInput.generatedAt,
      frozen: severity === "high" || severity === "critical",
    }));
  };

  for (const error of input.errors) {
    if (error.code === "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT") {
      pushDrift("governance_mismatch", "high");
    } else if (error.code === "DETERMINISTIC_CONFIDENCE_SCORING_VERSION_UNKNOWN") {
      pushDrift("validator_mismatch", "critical");
    } else if (error.code === "DETERMINISTIC_CONFIDENCE_REPLAY_HASH_MISMATCH") {
      pushDrift("audit_hash_mismatch", "critical");
    } else if (error.code === "DETERMINISTIC_CONFIDENCE_AUTHORITY_ESCALATION") {
      pushDrift("authority_mismatch", "critical");
    } else if (error.code === "DETERMINISTIC_CONFIDENCE_PROPOSAL_LINEAGE_CORRUPTED") {
      pushDrift("dependency_mismatch", "high");
    }
  }

  return Object.freeze(drifts);
}
