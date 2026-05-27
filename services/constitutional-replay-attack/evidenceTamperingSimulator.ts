import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function simulateEvidenceTampering(input: ConstitutionalReplayAttackInput): Readonly<{
  evidenceImmutable: boolean;
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const tampered = markers.includes("evidencetampering")
    || markers.includes("evidencemutation")
    || markers.includes("evidencebundlecorruption");
  if (!tampered) {
    return Object.freeze({
      evidenceImmutable: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      drifts: Object.freeze([]),
    });
  }
  const error: ConstitutionalReplayError = Object.freeze({
    code: "CONSTITUTIONAL_REPLAY_EVIDENCE_CORRUPTION",
    message: "Evidence bundle tampering was detected during replay attack simulation.",
    path: "metadata",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("evidence-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "evidence",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("evidence-violation", error),
  });
  const driftRecord: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("evidence-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "EVIDENCE_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("evidence-drift", error),
  });
  return Object.freeze({
    evidenceImmutable: false,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([driftRecord]),
  });
}
