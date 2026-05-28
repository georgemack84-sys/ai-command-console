import type { ConstitutionalAttackEngineInput, ReplayAttackInspection } from "@/types/constitutional-attack-engine";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

export function buildAttackReplayInspection(input: ConstitutionalAttackEngineInput): ReplayAttackInspection {
  const determinism = assessReplayDeterminism({
    ledgerEvents: input.coordinationReplay.ledger.entries.map((entry, index) => ({
      ledgerIndex: index,
      entryId: entry.entryId,
      createdAt: entry.createdAt,
    })),
    continuitySnapshots: [{ replaySnapshotId: input.coordinationReplay.routing.replaySnapshotId }],
    auditEvents: [{ auditId: input.coordinationReplay.audit.auditId, evidenceHash: input.coordinationReplay.audit.evidenceHash }],
  });
  const base = Object.freeze({
    replayId: input.coordinationReplay.replayId,
    replayDeterministic: determinism.deterministic,
    replayState: input.coordinationReplay.state,
    replayLedgerId: input.coordinationReplay.ledger.ledgerId,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashConstitutionalAttackValue("replay-inspection", base),
  });
}
