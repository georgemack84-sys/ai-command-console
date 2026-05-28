import type {
  ConstitutionalReplayStabilityError,
  ConstitutionalReplayStabilityInput,
  ReplayEscalationReconstruction,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";
import { normalizeReplayStabilityMetadata } from "./replaySchemas";

export function reconstructReplayEscalation(input: ConstitutionalReplayStabilityInput): {
  escalation: ReplayEscalationReconstruction;
  errors: readonly ConstitutionalReplayStabilityError[];
} {
  const boundary = input.constitutionalAuthorityBoundaryResult;
  const escalationCertified = boundary.record.certificationState === "CERTIFIED"
    || boundary.record.certificationState === "CONDITIONAL";
  const normalized = normalizeReplayStabilityMetadata(input.metadata);
  const escalationState = escalationCertified
    ? "stable"
    : boundary.record.certificationState === "DISPUTED"
      ? "disputed"
      : "frozen";
  const errors: ConstitutionalReplayStabilityError[] = [];
  if (!escalationCertified || normalized.includes("escalationcorruption") || normalized.includes("escalationsuppression")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_REPLAY_STABILITY_ESCALATION_CORRUPTION",
      message: "Escalation reconstruction diverged or suppression markers were detected.",
      path: !escalationCertified ? "domainCertifications.escalation" : "metadata",
    }));
  }
  const escalation: ReplayEscalationReconstruction = Object.freeze({
    replayId: input.replayId,
    escalationState,
    escalationHash: hashReplayStabilityValue("constitutional-replay-stability-escalation", {
      replayId: input.replayId,
      escalationState,
    }),
  });
  return Object.freeze({
    escalation,
    errors: Object.freeze(errors),
  });
}
