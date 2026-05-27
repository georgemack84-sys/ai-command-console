export type SnapshotIntegrityCheck = Readonly<{
  name: string;
  passed: boolean;
  expected?: string;
  actual?: string;
}>;

export type SnapshotIntegrityView = Readonly<{
  valid: boolean;
  payloadHashValid: boolean;
  schemaHashValid: boolean;
  governanceHashValid: boolean;
  authorityHashValid: boolean;
  replayHashValid: boolean;
  integrityHashValid: boolean;
  checks: readonly SnapshotIntegrityCheck[];
}>;
