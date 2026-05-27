export type MonitoringTriggerType =
  | "drift"
  | "risk"
  | "replay"
  | "governance"
  | "runtime"
  | "confidence";

export type MonitoringTriggerSeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type MonitoringCautionState =
  | "observe"
  | "restricted"
  | "escalated"
  | "frozen-recommended";

export type MonitoringTrigger = Readonly<{
  triggerId: string;
  triggerType: MonitoringTriggerType;
  severity: MonitoringTriggerSeverity;
  cautionState: MonitoringCautionState;
  confidenceScore: number;
  replayBindings: readonly string[];
  governanceBindings: readonly string[];
  overrideBindings: readonly string[];
  evidenceHashes: readonly string[];
  lineageHash: string;
  createdAt: string;
}>;

export type RuntimeObservationSnapshot = Readonly<{
  heartbeatState: "healthy" | "degraded" | "missing";
  leaseState: "stable" | "unstable" | "missing";
  queueDepth: number;
  retryRate: number;
  telemetryTimestamp: string;
}>;
