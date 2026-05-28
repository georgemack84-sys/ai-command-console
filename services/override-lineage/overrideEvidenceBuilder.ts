import type {
  CoordinationLineageInspection,
  EscalationRationaleInspection,
  HumanCoordinationOverrideInput,
  OverrideEvidenceRecord,
  ReplayVisibilityInspection,
} from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function buildOverrideEvidence(input: {
  overrideInput: HumanCoordinationOverrideInput;
  replayInspection: ReplayVisibilityInspection;
  coordinationInspection: CoordinationLineageInspection;
  escalationInspection: EscalationRationaleInspection;
  reasons: readonly string[];
}): OverrideEvidenceRecord {
  const base = Object.freeze({
    overrideId: input.overrideInput.overrideId,
    coordinationId: input.overrideInput.coordinationRecord.coordinationId,
    replayLineageId: input.replayInspection.replayLineageLedgerId,
    escalationLineageId: input.overrideInput.escalationResult.lineage.lineageId,
    routingLineageId: input.overrideInput.routingResult.lineage.lineageId,
    coordinationLineageId: input.coordinationInspection.chronologyLineageId,
    reasons: Object.freeze([...input.reasons]),
  });
  return Object.freeze({
    evidenceId: hashCoordinationReplayValue("human-override-evidence-id", base),
    ...base,
    evidenceHash: hashCoordinationReplayValue("human-override-evidence", base),
  });
}
