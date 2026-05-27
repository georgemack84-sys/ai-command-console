import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function simulateReplayCorruption(input: ConstitutionalReplayAttackInput): Readonly<{
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const detected = markers.includes("replaylineagecorruption")
    || markers.includes("stalereplay")
    || markers.includes("approvallineagecorruption")
    || markers.includes("escalationlineagecorruption");
  if (!detected) {
    return Object.freeze({ errors: Object.freeze([]), violations: Object.freeze([]), drifts: Object.freeze([]) });
  }
  const error: ConstitutionalReplayError = Object.freeze({
    code: "CONSTITUTIONAL_REPLAY_LINEAGE_BREAK",
    message: "Replay lineage corruption prevents immutable historical reconstruction.",
    path: "metadata",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("replay-corruption-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "lineage",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("replay-corruption-violation", error),
  });
  const drift: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("replay-corruption-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "LINEAGE_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("replay-corruption-drift", error),
  });
  return Object.freeze({
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([drift]),
  });
}
