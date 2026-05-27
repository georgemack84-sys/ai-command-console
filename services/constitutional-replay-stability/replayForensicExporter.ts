import type {
  ReplayConfidenceEvolution,
  ReplayEscalationReconstruction,
  ReplayForensicExport,
  ReplayOverridePropagation,
  ReplayStabilityEvidence,
  ReplayStabilityLineageLedger,
} from "./replayStateTypes";
import { hashReplayStabilityValue } from "./replayHashingEngine";

export function exportReplayForensics(input: {
  replayId: string;
  evidence: ReplayStabilityEvidence;
  lineage: ReplayStabilityLineageLedger;
  governanceHash: string;
  escalation: ReplayEscalationReconstruction;
  confidence: ReplayConfidenceEvolution;
  override: ReplayOverridePropagation;
}): ReplayForensicExport {
  return Object.freeze({
    exportId: hashReplayStabilityValue("constitutional-replay-stability-export-id", input.replayId),
    replayId: input.replayId,
    evidenceHash: input.evidence.evidenceHash,
    lineageHash: input.lineage.lineageHash,
    governanceHash: input.governanceHash,
    escalationHash: input.escalation.escalationHash,
    confidenceHash: input.confidence.confidenceHash,
    overrideHash: input.override.overrideHash,
    exportHash: hashReplayStabilityValue("constitutional-replay-stability-export", {
      replayId: input.replayId,
      evidenceHash: input.evidence.evidenceHash,
      lineageHash: input.lineage.lineageHash,
      governanceHash: input.governanceHash,
      escalationHash: input.escalation.escalationHash,
      confidenceHash: input.confidence.confidenceHash,
      overrideHash: input.override.overrideHash,
    }),
  });
}
