import type { MonitoringCautionState, MonitoringTriggerSeverity } from "./monitoringTrigger";

export type TriggerCorrelation = Readonly<{
  correlationId: string;
  triggerIds: readonly string[];
  resultingSeverity: MonitoringTriggerSeverity;
  resultingCautionState: MonitoringCautionState;
  reason: string;
  evidenceHashes: readonly string[];
  createdAt: string;
}>;
