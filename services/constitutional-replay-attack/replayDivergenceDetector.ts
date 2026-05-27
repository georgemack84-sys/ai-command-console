import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function detectReplayDivergence(input: ConstitutionalReplayAttackInput): Readonly<{
  replayDeterministic: boolean;
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const divergence = markers.includes("replaydivergence")
    || markers.includes("adaptivereplay")
    || markers.includes("replayrepair");
  if (!divergence) {
    return Object.freeze({
      replayDeterministic: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      drifts: Object.freeze([]),
    });
  }
  const code = markers.includes("replayrepair")
    ? "CONSTITUTIONAL_REPLAY_REPAIR_ATTEMPT"
    : "CONSTITUTIONAL_REPLAY_LINEAGE_BREAK";
  const error: ConstitutionalReplayError = Object.freeze({
    code,
    message: "Replay divergence, repair, or adaptive replay behavior was detected.",
    path: "metadata",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("replay-divergence-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "replay",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("replay-divergence-violation", error),
  });
  const driftRecord: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("replay-divergence-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "LINEAGE_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("replay-divergence-drift", error),
  });
  return Object.freeze({
    replayDeterministic: false,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([driftRecord]),
  });
}
