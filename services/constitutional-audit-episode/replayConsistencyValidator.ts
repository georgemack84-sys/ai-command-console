import type {
  ConstitutionalAuditEpisodeInput,
  ConstitutionalAuditError,
} from "@/types/constitutional-audit-episode";

export function validateConstitutionalReplayConsistency(
  input: ConstitutionalAuditEpisodeInput,
): readonly ConstitutionalAuditError[] {
  const normalized = JSON.stringify(input.metadata ?? {}).toLowerCase().replace(/[^a-z0-9]+/g, "");
  const errors: ConstitutionalAuditError[] = [];
  if (!input.futureAutonomyResult.record.replaySafe || normalized.includes("replaycorruption") || normalized.includes("replaymismatch")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_REPLAY_MISMATCH",
      message: "Replay verification must bind to original constitutional state and deterministic replay lineage.",
      path: "futureAutonomyResult.record.replaySafe",
    }));
  }
  if (normalized.includes("replayrepair") || normalized.includes("adaptivereplaymutation") || normalized.includes("syntheticlineagerepair")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_REPLAY_REPAIR_ATTEMPT",
      message: "Replay repair or adaptive replay mutation is forbidden.",
      path: "metadata",
    }));
  }
  if (normalized.includes("currentstatesubstitution") || normalized.includes("latestgovernancestate")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUDIT_CURRENT_STATE_SUBSTITUTION",
      message: "Current-state substitution is forbidden in constitutional audit reconstruction.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
