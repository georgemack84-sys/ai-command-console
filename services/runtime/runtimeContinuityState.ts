import type { TenantContext } from "../tenancy/tenantTypes";
import { appendRuntimeContinuityAuditEvent } from "./runtimeContinuityAudit";
import { getLatestContinuitySnapshot, listContinuitySnapshots } from "./continuityLedger";
import { recordContinuityMetric } from "./continuityMetrics";
import { createRuntimeContinuitySnapshot } from "./continuitySnapshot";
import { evaluateRuntimeDegradation } from "./runtimeDegradationTracker";
import { getRuntimeTelemetrySnapshot } from "./runtimeTelemetryAggregator";
import { aggregateRuntimeHealth } from "./runtimeHealthAggregator";
import type { RuntimeContinuityState, RuntimeTelemetrySnapshot } from "./runtimeContinuityTypes";
import { RUNTIME_CONTINUITY_ERROR_CODES } from "./runtimeContinuityErrors";

export function getRuntimeContinuityState({
  tenantContext,
  nowMs = Date.now(),
  telemetry,
  persistSnapshot = true,
}: {
  tenantContext?: TenantContext;
  nowMs?: number;
  telemetry?: RuntimeTelemetrySnapshot;
  persistSnapshot?: boolean;
} = {}):
  | { ok: true; data: RuntimeContinuityState & { degradation: ReturnType<typeof evaluateRuntimeDegradation> } }
  | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } } {
  const telemetrySnapshot = telemetry || getRuntimeTelemetrySnapshot({ tenantContext, nowMs });
  const state = aggregateRuntimeHealth(telemetrySnapshot);
  const snapshot = createRuntimeContinuitySnapshot({
    tenantContext,
    generatedAt: state.updatedAt,
    telemetry: telemetrySnapshot,
    persist: persistSnapshot,
  });
  const previousSnapshots = listContinuitySnapshots({ tenantId: tenantContext?.tenantId || null, limit: 5 });
  const degradation = evaluateRuntimeDegradation(previousSnapshots);

  if (state.replayDivergenceDetected) {
    appendRuntimeContinuityAuditEvent({
      type: "runtime.continuity.risk.escalated",
      tenantId: tenantContext?.tenantId || null,
      workspaceId: tenantContext?.workspaceId || null,
      payload: {
        reason: RUNTIME_CONTINUITY_ERROR_CODES.CONTINUITY_REPLAY_DIVERGENCE,
        snapshotId: snapshot.snapshotId,
      },
    });
    recordContinuityMetric("replay_divergence", tenantContext?.tenantId || null);
  }

  appendRuntimeContinuityAuditEvent({
    type: "runtime.continuity.state.updated",
    tenantId: tenantContext?.tenantId || null,
    workspaceId: tenantContext?.workspaceId || null,
    payload: {
      snapshotId: snapshot.snapshotId,
      runtimeState: state.runtimeState,
      continuityConfidence: state.continuityConfidence,
      survivabilityScore: state.survivabilityScore,
    },
  });

  return {
    ok: true,
    data: {
      ...state,
      degradation,
    },
  };
}

export function getLatestRuntimeContinuitySnapshot(tenantContext?: TenantContext) {
  return getLatestContinuitySnapshot(tenantContext?.tenantId || null);
}
