import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { ReplayVisibilityInspection } from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";

export function inspectReplayVisibility(replay: CoordinationReplayResult): ReplayVisibilityInspection {
  const determinism = assessReplayDeterminism({
    ledgerEvents: replay.ledger.entries.map((entry, index) => ({
      ledgerIndex: index,
      entryId: entry.entryId,
      createdAt: entry.createdAt,
    })),
    continuitySnapshots: [
      { replaySnapshotId: replay.governance.governanceSnapshotId },
    ],
    auditEvents: [
      { auditId: replay.audit.auditId, evidenceHash: replay.audit.evidenceHash },
    ],
  });
  const base = Object.freeze({
    replayId: replay.replayId,
    replaySnapshotId: replay.routing.replaySnapshotId,
    replayLineageLedgerId: replay.ledger.ledgerId,
    replayDeterministic: determinism.deterministic,
    replayState: replay.state,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("human-override-replay-inspection", base),
  });
}
