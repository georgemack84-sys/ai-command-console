export type TelemetryEvidence = Readonly<{
  evidenceId: string;
  telemetryId: string;
  governanceLineageId: string;
  replayLineageId: string;
  escalationLineageId: string;
  approvalLineageId: string;
  evidenceRefs: readonly string[];
  evidenceHash: string;
  immutable: true;
}>;
