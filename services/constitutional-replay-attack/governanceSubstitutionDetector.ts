import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function detectGovernanceSubstitution(input: ConstitutionalReplayAttackInput): Readonly<{
  governanceLinked: boolean;
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("governancesubstitution")
    || markers.includes("currentstatesubstitution")
    || markers.includes("stalereplay")
    || input.approvalConflictResult.errors.some((item) => item.code.includes("GOVERNANCE"));
  if (!drift) {
    return Object.freeze({
      governanceLinked: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      drifts: Object.freeze([]),
    });
  }
  const error: ConstitutionalReplayError = Object.freeze({
    code: markers.includes("currentstatesubstitution")
      ? "CONSTITUTIONAL_REPLAY_CURRENT_STATE_SUBSTITUTION"
      : "CONSTITUTIONAL_REPLAY_GOVERNANCE_DRIFT",
    message: "Governance substitution or current-state replay substitution was detected.",
    path: "metadata",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("governance-drift-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "governance",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("governance-drift-violation", error),
  });
  const driftRecord: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("governance-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "GOVERNANCE_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("governance-drift", error),
  });
  return Object.freeze({
    governanceLinked: false,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([driftRecord]),
  });
}
