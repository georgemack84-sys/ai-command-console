import type { FutureAutonomyEvidenceRecord, FutureAutonomySimulationInput } from "@/types/future-autonomy";
import { hashFutureAutonomyValue } from "./futureAutonomyHashEngine";

export function buildFutureAutonomyEvidence(input: {
  simulationInput: FutureAutonomySimulationInput;
  replayHash: string;
  escalationHash: string;
  confidenceHash: string;
  topologyHash: string;
  boundaryHash: string;
  reasons: readonly string[];
}): FutureAutonomyEvidenceRecord {
  const governanceDriftResult = input.simulationInput.governanceDriftResult;
  const evidenceHash = hashFutureAutonomyValue("future-autonomy-evidence", {
    simulationId: input.simulationInput.simulationId,
    governanceDriftLineageId: governanceDriftResult.lineage.lineageId,
    replayHash: input.replayHash,
    escalationHash: input.escalationHash,
    confidenceHash: input.confidenceHash,
    topologyHash: input.topologyHash,
    boundaryHash: input.boundaryHash,
    reasons: input.reasons,
  });
  return Object.freeze({
    evidenceId: hashFutureAutonomyValue("future-autonomy-evidence-id", input.simulationInput.simulationId),
    simulationId: input.simulationInput.simulationId,
    governanceDriftLineageId: governanceDriftResult.lineage.lineageId,
    replayLineageId: governanceDriftResult.replayInspection.replayLedgerId,
    escalationLineageId: governanceDriftResult.escalationInspection.escalationLineageId,
    approvalLineageId: governanceDriftResult.evidence.approvalConflictLineageId,
    confidenceHash: input.confidenceHash,
    topologyHash: input.topologyHash,
    evidenceHash,
    immutable: true,
  });
}
