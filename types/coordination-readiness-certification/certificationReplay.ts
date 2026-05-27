export type CertificationReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type CertificationInspection = Readonly<{
  certificationId: string;
  coordinationId: string;
  certificationState: string;
  verdicts: readonly string[];
  inspectionHash: string;
}>;

export type ReplayCertificationInspection = Readonly<{
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
  inspectionHash: string;
}>;

export type GovernanceCertificationInspection = Readonly<{
  governanceSnapshotId: string;
  governanceLinked: boolean;
  governanceLineageId: string;
  inspectionHash: string;
}>;

export type EscalationCertificationInspection = Readonly<{
  escalationId: string;
  escalationLineageId: string;
  escalationState: string;
  inspectionHash: string;
}>;

export type BoundaryCertificationInspection = Readonly<{
  boundaryId: string;
  boundaryVerdict: string;
  boundaryState: string;
  inspectionHash: string;
}>;
