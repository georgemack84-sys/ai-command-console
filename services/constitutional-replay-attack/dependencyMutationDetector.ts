import type {
  ConstitutionalReplayAttackInput,
  ConstitutionalReplayDriftRecord,
  ConstitutionalReplayError,
  ConstitutionalReplayViolation,
} from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "./deterministicReplayHasher";

export function detectDependencyMutation(input: ConstitutionalReplayAttackInput): Readonly<{
  dependencySafe: boolean;
  errors: readonly ConstitutionalReplayError[];
  violations: readonly ConstitutionalReplayViolation[];
  drifts: readonly ConstitutionalReplayDriftRecord[];
}> {
  const markers = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const drift = markers.includes("syntheticdependencyinjection")
    || markers.includes("dependencymutation")
    || markers.includes("dependencyreconstructionblocked");
  if (!drift) {
    return Object.freeze({
      dependencySafe: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      drifts: Object.freeze([]),
    });
  }
  const error: ConstitutionalReplayError = Object.freeze({
    code: "CONSTITUTIONAL_REPLAY_TOPOLOGY_DRIFT",
    message: "Synthetic dependency injection or dependency mutation was detected.",
    path: "metadata",
  });
  const violation: ConstitutionalReplayViolation = Object.freeze({
    violationId: hashConstitutionalReplayValue("dependency-drift-violation-id", input.replayAttackId),
    replayAttackId: input.replayAttackId,
    coordinationId: input.approvalConflictResult.record.coordinationId,
    domain: "dependency",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashConstitutionalReplayValue("dependency-drift-violation", error),
  });
  const driftRecord: ConstitutionalReplayDriftRecord = Object.freeze({
    driftId: hashConstitutionalReplayValue("dependency-drift-id", error),
    replayAttackId: input.replayAttackId,
    classification: "DEPENDENCY_DRIFT",
    detected: true,
    rationale: error.message,
    advisoryOnly: true,
    deterministicHash: hashConstitutionalReplayValue("dependency-drift", error),
  });
  return Object.freeze({
    dependencySafe: false,
    errors: Object.freeze([error]),
    violations: Object.freeze([violation]),
    drifts: Object.freeze([driftRecord]),
  });
}
