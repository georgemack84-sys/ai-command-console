import type {
  AntiEmergenceContainmentState,
  EmergenceEvidence,
  EmergenceForensicExport,
  EmergenceLineageLedger,
} from "./antiEmergenceStateTypes";
import { hashEmergenceValue } from "./emergenceHashingEngine";

export function exportEmergenceForensics(input: {
  containmentId: string;
  evidence: EmergenceEvidence;
  lineage: EmergenceLineageLedger;
  containmentState: AntiEmergenceContainmentState;
  topologyHash: string;
}): EmergenceForensicExport {
  return Object.freeze({
    exportId: hashEmergenceValue("anti-emergence-export-id", input.containmentId),
    containmentId: input.containmentId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    containmentHash: input.containmentState.containmentHash,
    topologyHash: input.topologyHash,
    exportHash: hashEmergenceValue("anti-emergence-export", {
      containmentId: input.containmentId,
      evidenceHash: input.evidence.evidenceHash,
      lineageHash: input.lineage.lineageHash,
      containmentHash: input.containmentState.containmentHash,
      topologyHash: input.topologyHash,
    }),
  });
}
