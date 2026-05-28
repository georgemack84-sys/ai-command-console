import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { CoordinationLineageInspection } from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectCoordinationLineage(
  coordination: ConstitutionalCoordinationRecord,
): CoordinationLineageInspection {
  const base = Object.freeze({
    coordinationId: coordination.coordinationId,
    chronologyLineageId: coordination.chronology.lineageId,
    chronologyEntries: Object.freeze(coordination.chronology.entries.map((entry) => entry.entryId)),
    coordinationState: coordination.coordinationState,
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("human-override-coordination-inspection", base),
  });
}
