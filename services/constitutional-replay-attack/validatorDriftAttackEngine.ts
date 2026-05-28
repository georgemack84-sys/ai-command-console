import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function detectValidatorDriftAttack(input: ConstitutionalReplayAttackInput): Readonly<{
  validatorDeterministic: boolean;
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const mismatch = !input.validatorVersionId
    || markers.includes("validatorsubstitution")
    || markers.includes("validatormismatch")
    || markers.includes("dynamicvalidatorloading");
  if (!mismatch) {
    return Object.freeze({
      validatorDeterministic: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      drifts: Object.freeze([]),
    });
  }
  const error: ConstitutionalReplayError = Object.freeze({
    code: "CONSTITUTIONAL_REPLAY_VALIDATOR_MISMATCH",
    message: "Validator mismatch or substitution detected in replay reconstruction.",
    path: "validatorVersionId",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("validator-drift-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "validator",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("validator-drift-violation", error),
  });
  const drift: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("validator-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "VALIDATOR_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("validator-drift", error),
  });
  return Object.freeze({
    validatorDeterministic: false,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([drift]),
  });
}
