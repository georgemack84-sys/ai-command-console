import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { TenantContext } from "../tenancy/tenantTypes";
import { appendContinuitySnapshot } from "./continuityLedger";
import { aggregateRuntimeHealth } from "./runtimeHealthAggregator";
import { getRuntimeTelemetrySnapshot } from "./runtimeTelemetryAggregator";
import type { ContinuitySnapshot, RuntimeTelemetrySnapshot } from "./runtimeContinuityTypes";
import { computeContinuityRisk } from "./continuityRiskEngine";
import { computeSurvivabilityScore } from "./survivabilityScoring";
import { recordContinuityMetric } from "./continuityMetrics";

export function createRuntimeContinuitySnapshot({
  tenantContext,
  generatedAt,
  telemetry,
  persist = true,
}: {
  tenantContext?: TenantContext;
  generatedAt?: string;
  telemetry?: RuntimeTelemetrySnapshot;
  persist?: boolean;
}) {
  const telemetrySnapshot = telemetry || getRuntimeTelemetrySnapshot({
    tenantContext,
    nowMs: generatedAt ? Date.parse(generatedAt) : Date.now(),
  });
  const runtimeState = aggregateRuntimeHealth({
    ...telemetrySnapshot,
    timestamp: generatedAt || telemetrySnapshot.timestamp,
  });
  const snapshot: ContinuitySnapshot = {
    snapshotId: "",
    tenantId: tenantContext?.tenantId || telemetrySnapshot.tenantId || null,
    workspaceId: tenantContext?.workspaceId || telemetrySnapshot.workspaceId || null,
    runtimeState: runtimeState.runtimeState,
    activeExecutions: telemetrySnapshot.activeExecutions,
    degradedDependencies: [...telemetrySnapshot.degradedDependencies],
    staleLocks: telemetrySnapshot.staleLocks,
    recoveryInProgress: telemetrySnapshot.recoveryInProgress,
    continuityRiskScore: computeContinuityRisk(telemetrySnapshot),
    survivabilityScore: computeSurvivabilityScore({
      continuityRiskScore: computeContinuityRisk(telemetrySnapshot),
      workerAvailabilityScore: telemetrySnapshot.workerAvailabilityScore,
      dependencyStabilityScore: telemetrySnapshot.dependencyStabilityScore,
      replayDivergenceDetected: telemetrySnapshot.replayDivergenceDetected,
    }),
    replayDivergenceDetected: telemetrySnapshot.replayDivergenceDetected,
    workerAvailabilityScore: telemetrySnapshot.workerAvailabilityScore,
    dependencyStabilityScore: telemetrySnapshot.dependencyStabilityScore,
    timestamp: generatedAt || telemetrySnapshot.timestamp,
  };
  snapshot.snapshotId = `continuity_${hashPayloadDeterministically(snapshot)}`;
  if (persist) {
    appendContinuitySnapshot(snapshot);
    recordContinuityMetric("snapshot.created", snapshot.tenantId || null);
  }
  return snapshot;
}
