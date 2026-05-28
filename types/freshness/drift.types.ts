export interface DriftRecord {
  driftId: string;
  driftType:
    | "telemetry"
    | "environment"
    | "governance"
    | "replay"
    | "policy"
    | "confidence";
  severity:
    | "low"
    | "moderate"
    | "high"
    | "critical";
  detectedAt: string;
  affectedProposalIds: readonly string[];
  requiresEscalation: boolean;
  freezeRequired: boolean;
  replaySafe: boolean;
}

export type CoordinationDriftReport = Readonly<{
  proposalId: string;
  drifts: readonly DriftRecord[];
  deterministic: boolean;
  reportHash: string;
  createdAt: string;
}>;
