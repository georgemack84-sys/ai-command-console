import type { SamChaosScenarioType } from "../chaos/samChaosTypes";
import type { SamDegradedMode } from "../scaling/samScalingTypes";

export type SamLoadScenarioType =
  | "QUEUE_SATURATION"
  | "RETRY_STORM"
  | "AUDIT_LATENCY_SPIKE"
  | "IDEMPOTENCY_SLOWDOWN"
  | "DRYRUN_CONGESTION"
  | "LOCK_CONTENTION"
  | "DEGRADED_MODE_ESCALATION"
  | "CHAOS_UNDER_LOAD"
  | "DUPLICATE_REPLAY_PRESSURE"
  | "CONCURRENT_PROPOSAL_FLOOD";

export type SamLoadScenarioRequest = {
  type: SamLoadScenarioType;
  executionId: string;
  attemptId: string;
  deterministicSeed: string;
  dryRun: true;
  iterations?: number;
  chaosType?: SamChaosScenarioType;
};

export type SamLoadScenarioMetrics = {
  duplicateDryRunDetected: boolean;
  duplicateAuditDetected: boolean;
  governanceBypassDetected: boolean;
  finalMode: SamDegradedMode;
};

export type SamLoadScenarioResult = {
  type: SamLoadScenarioType;
  passed: boolean;
  findings: string[];
  metrics: SamLoadScenarioMetrics;
};
