export type ReadinessDrift = Readonly<{
  driftId: string;
  driftDetected: boolean;
  mismatches: readonly string[];
  evidenceRefs: readonly string[];
  createdAt: string;
}>;
