export type FutureAutonomyEvidenceRecord = Readonly<{
  evidenceId: string;
  simulationId: string;
  governanceDriftLineageId: string;
  replayLineageId: string;
  escalationLineageId: string;
  approvalLineageId: string;
  confidenceHash: string;
  topologyHash: string;
  evidenceHash: string;
  immutable: true;
}>;
