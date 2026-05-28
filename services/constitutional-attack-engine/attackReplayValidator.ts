import type {
  AttackViolation,
  ConstitutionalAttackEngineInput,
  ConstitutionalAttackError,
  ConstitutionalWeakness,
} from "@/types/constitutional-attack-engine";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

function error(
  code: ConstitutionalAttackError["code"],
  message: string,
  path?: string,
): ConstitutionalAttackError {
  return Object.freeze({ code, message, path });
}

export function validateAttackReplay(input: ConstitutionalAttackEngineInput): {
  replayDeterministic: boolean;
  errors: readonly ConstitutionalAttackError[];
  violations: readonly AttackViolation[];
  weaknesses: readonly ConstitutionalWeakness[];
} {
  const determinism = assessReplayDeterminism({
    ledgerEvents: input.coordinationReplay.ledger.entries.map((entry, index) => ({
      ledgerIndex: index,
      entryId: entry.entryId,
      createdAt: entry.createdAt,
    })),
    continuitySnapshots: [{ replaySnapshotId: input.coordinationReplay.routing.replaySnapshotId }],
    auditEvents: [{ auditId: input.coordinationReplay.audit.auditId, evidenceHash: input.coordinationReplay.audit.evidenceHash }],
  });
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const replayDeterministic =
    determinism.deterministic
    && input.coordinationReplay.state !== "fail_closed"
    && !serialized.includes("repairreplay")
    && !serialized.includes("replayrepair")
    && !serialized.includes("replaymutation");
  if (replayDeterministic) {
    return Object.freeze({
      replayDeterministic: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }

  return Object.freeze({
    replayDeterministic: false,
    errors: Object.freeze([
      error(
        serialized.includes("repairreplay") || serialized.includes("replayrepair")
          ? "ATTACK_REPLAY_REPAIR"
          : "ATTACK_REPLAY_LINEAGE_MISSING",
        "Attack replay was ambiguous, mutated, or attempted to repair immutable history.",
        "coordinationReplay",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashConstitutionalAttackValue("replay-violation-id", input.attackId),
        attackId: input.attackId,
        coordinationId: input.coordinationRecord.coordinationId,
        domain: "replay",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashConstitutionalAttackValue("replay-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashConstitutionalAttackValue("replay-weakness-id", input.attackId),
        attackId: input.attackId,
        classification: "REPLAY_BREAK_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: "Replay determinism or immutable lineage was not preserved under simulation.",
        advisoryOnly: true as const,
        deterministicHash: hashConstitutionalAttackValue("replay-weakness", serialized),
      }),
    ]),
  });
}
