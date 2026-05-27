export type ReadinessEvidence = Readonly<{
  evidenceId: string;
  readinessId: string;
  telemetryEvidenceId: string;
  forensicEvidenceId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;
