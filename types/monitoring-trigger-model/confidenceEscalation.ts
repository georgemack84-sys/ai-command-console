import type { MonitoringCautionState } from "./monitoringTrigger";

export type ConfidenceEscalation = Readonly<{
  escalationId: string;
  previousConfidenceScore: number;
  currentConfidenceScore: number;
  cautionState: MonitoringCautionState;
  uncertaintyAmplified: boolean;
  evidenceHashes: readonly string[];
  lineageHash: string;
  createdAt: string;
}>;
