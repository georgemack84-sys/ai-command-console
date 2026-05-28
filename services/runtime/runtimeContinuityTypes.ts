export const RUNTIME_STATES = [
  "HEALTHY",
  "DEGRADED",
  "RECOVERING",
  "STALLED",
  "QUARANTINED",
  "FAILED",
  "PARTIALLY_OPERATIONAL",
  "CONTINUITY_RISK",
] as const;

export type RuntimeState = (typeof RUNTIME_STATES)[number];

export type ContinuitySnapshot = {
  snapshotId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  runtimeState: string;
  activeExecutions: number;
  degradedDependencies: string[];
  staleLocks: number;
  recoveryInProgress: boolean;
  continuityRiskScore: number;
  survivabilityScore: number;
  replayDivergenceDetected: boolean;
  workerAvailabilityScore: number;
  dependencyStabilityScore: number;
  timestamp: string;
};

export type RuntimeContinuityState = {
  runtimeState: RuntimeState;
  continuityConfidence: number;
  recoveryEligible: boolean;
  recoveryReadiness: number;
  degradedDependencies: string[];
  activeExecutions: number;
  staleLocks: number;
  replayDivergenceDetected: boolean;
  dependencyStabilityScore: number;
  workerAvailabilityScore: number;
  survivabilityScore: number;
  updatedAt: string;
};

export type RuntimeTelemetrySnapshot = {
  tenantId?: string | null;
  workspaceId?: string | null;
  activeExecutions: number;
  staleLocks: number;
  activeLocks: number;
  recoveryBacklog: number;
  recoveryInProgress: boolean;
  replayDivergenceDetected: boolean;
  workerAvailabilityScore: number;
  dependencyStabilityScore: number;
  degradedDependencies: string[];
  startupReady: boolean | null;
  startupSummary?: string | null;
  criticalFailures: number;
  disputedFailures: number;
  degradedSubsystems: number;
  timestamp: string;
};

export type RuntimeDegradationAssessment = {
  status: "stable" | "degrading" | "cascading" | "chronic";
  degraded: boolean;
  cascadingFailures: boolean;
  chronicRuntimeDecay: boolean;
  recoveryLoopDetected: boolean;
  evidence: string[];
};

export type ContinuityConfidenceLevel =
  | "VERIFIED"
  | "STABLE"
  | "MONITORED"
  | "DEGRADED"
  | "DISPUTED"
  | "UNTRUSTED";
