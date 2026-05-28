import type {
  EscalationEvidence,
  EscalationForensicExport,
  EscalationLineageLedger,
  OversightTriggerRecord,
} from "./escalationStateTypes";
import { hashEscalationValue } from "./escalationHashingEngine";

export function exportEscalationForensics(input: {
  escalationId: string;
  evidence: EscalationEvidence;
  lineage: EscalationLineageLedger;
  oversightTrigger: OversightTriggerRecord;
  replayHash: string;
}): EscalationForensicExport {
  return Object.freeze({
    exportId: hashEscalationValue("escalation-determinism-export-id", input.escalationId),
    escalationId: input.escalationId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    triggerHash: input.oversightTrigger.triggerHash,
    replayHash: input.replayHash,
    exportHash: hashEscalationValue("escalation-determinism-export", {
      escalationId: input.escalationId,
      evidenceHash: input.evidence.evidenceHash,
      lineageHash: input.lineage.lineageHash,
      triggerHash: input.oversightTrigger.triggerHash,
      replayHash: input.replayHash,
    }),
  });
}
