import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { ReplayCertificationInspection } from "@/types/coordination-readiness-certification";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectReplayCertification(replay: CoordinationReplayResult): ReplayCertificationInspection {
  const determinism = assessReplayDeterminism({
    ledgerEvents: replay.ledger.entries.map((entry, index) => ({
      ledgerIndex: index,
      entryId: entry.entryId,
      createdAt: entry.createdAt,
    })),
    continuitySnapshots: [{ replaySnapshotId: replay.routing.replaySnapshotId }],
    auditEvents: [{ auditId: replay.audit.auditId, evidenceHash: replay.audit.evidenceHash }],
  });
  const base = Object.freeze({
    replayId: replay.replayId,
    replayDeterministic: determinism.deterministic,
    replayState: replay.state,
    replayLedgerId: replay.ledger.ledgerId,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-readiness-replay-inspection", base),
  });
}
