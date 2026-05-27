import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function detectReplayGapInjection(input: ConstitutionalReplayAttackInput): Readonly<{
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const detected = markers.includes("replaygapinjection")
    || markers.includes("missinglineage")
    || markers.includes("syntheticcontinuity")
    || markers.includes("inferredtransitions");
  if (!detected) {
    return Object.freeze({ errors: Object.freeze([]), violations: Object.freeze([]), drifts: Object.freeze([]) });
  }
  const error: ConstitutionalReplayError = Object.freeze({
    code: markers.includes("syntheticcontinuity") || markers.includes("inferredtransitions")
      ? "CONSTITUTIONAL_REPLAY_SYNTHETIC_CONTINUITY"
      : "CONSTITUTIONAL_REPLAY_LINEAGE_BREAK",
    message: "Replay gap injection or inferred continuity was detected.",
    path: "metadata",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("replay-gap-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "replay",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("replay-gap-violation", error),
  });
  const driftRecord: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("replay-gap-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "LINEAGE_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("replay-gap-drift", error),
  });
  return Object.freeze({
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([driftRecord]),
  });
}
