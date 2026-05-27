export type ConstitutionalEscalationBinding = Readonly<{
  escalationSnapshotId: string;
  escalationSnapshotHash: string;
  escalationLineageId: string;
  replaySafe: boolean;
  createdAt: string;
  bindingHash: string;
}>;
