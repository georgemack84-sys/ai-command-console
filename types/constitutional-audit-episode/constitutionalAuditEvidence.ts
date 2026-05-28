export type ConstitutionalAuditEvidence = Readonly<{
  evidenceId: string;
  episodeId: string;
  governanceLineageId: string;
  replayLineageId: string;
  escalationLineageId: string;
  approvalLineageId: string;
  evidenceRefs: readonly string[];
  evidenceHash: string;
  immutable: true;
}>;
