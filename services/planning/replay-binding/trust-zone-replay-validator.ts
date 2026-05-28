import { createReplayBindingFailure } from "./replay-binding-errors";
import type { ReplayBindingBuildInput, TrustZoneReplayValidation } from "./replay-binding-types";

export function validateTrustZoneReplay(input: ReplayBindingBuildInput): TrustZoneReplayValidation {
  const failures = [];
  const admissionZone = input.admissionReadiness.context.trustZone;
  const requestedZone = input.trustZoneId ?? admissionZone;

  if (requestedZone !== admissionZone) {
    failures.push(createReplayBindingFailure(
      "TRUST_ZONE_REPLAY_MISMATCH",
      `Replay binding trust zone ${requestedZone} does not match admitted trust zone ${admissionZone}.`,
      "trustZoneId",
    ));
  }

  if (
    input.admissionReadiness.result.decision === "QUARANTINED"
    || input.admissionReadiness.result.decision === "DENIED"
  ) {
    failures.push(createReplayBindingFailure(
      "REPLAY_CERTIFICATION_REVOKED",
      "Replay certification cannot proceed from a quarantined or denied admission state.",
      "admissionReadiness.result.decision",
    ));
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}
