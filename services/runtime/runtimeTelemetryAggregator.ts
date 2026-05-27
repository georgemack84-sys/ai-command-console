import { getFrozenStartupStatus } from "../startup/startupStatus";
import { getFailureTelemetrySnapshot } from "../failure/failureTelemetry";
import type { TenantContext } from "../tenancy/tenantTypes";
import type { RuntimeTelemetrySnapshot } from "./runtimeContinuityTypes";
import { analyzeDependencyStability } from "./dependencyStabilityAnalyzer";
import { trackWorkerAvailability } from "./workerAvailabilityTracker";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const executionStateStore = require("../executionStateStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const executionIntegrityStore = require("../executionIntegrityStore.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../auditTrail.js");

function isActiveLock(lock: Record<string, unknown>) {
  return lock.lockReleasedAt == null;
}

function isStaleLock(lock: Record<string, unknown>, nowMs: number) {
  const leaseExpiresAt = Number(lock.leaseExpiresAt || 0);
  const heartbeatAt = Number(lock.heartbeatAt || 0);
  return (leaseExpiresAt > 0 && leaseExpiresAt < nowMs) || (heartbeatAt > 0 && heartbeatAt < nowMs - 30_000);
}

function detectReplayDivergence(tenantId?: string | null) {
  const events = listAuditEvents(1000);
  return events.some((event: Record<string, unknown>) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    const eventTenantId = payload.tenantId == null ? null : String(payload.tenantId);
    if (tenantId && eventTenantId && eventTenantId !== tenantId) {
      return false;
    }
    return (
      String(event.type || "") === "failure.classified"
      && String(payload.category || "").toLowerCase() === "replay divergence"
    ) || (
      String(event.type || "") === "recovery.verification.completed"
      && payload.replayIntegrity === false
    );
  });
}

export function getRuntimeTelemetrySnapshot({
  tenantContext,
  nowMs = Date.now(),
  overrides,
}: {
  tenantContext?: TenantContext;
  nowMs?: number;
  overrides?: Partial<RuntimeTelemetrySnapshot>;
} = {}): RuntimeTelemetrySnapshot {
  if (overrides) {
    return {
      tenantId: tenantContext?.tenantId || overrides.tenantId || null,
      workspaceId: tenantContext?.workspaceId || overrides.workspaceId || null,
      activeExecutions: 0,
      staleLocks: 0,
      activeLocks: 0,
      recoveryBacklog: 0,
      recoveryInProgress: false,
      replayDivergenceDetected: false,
      workerAvailabilityScore: 1,
      dependencyStabilityScore: 1,
      degradedDependencies: [],
      startupReady: null,
      startupSummary: null,
      criticalFailures: 0,
      disputedFailures: 0,
      degradedSubsystems: 0,
      timestamp: new Date(nowMs).toISOString(),
      ...overrides,
    };
  }

  const startupStatus = getFrozenStartupStatus();
  const tenantScope = tenantContext ? { tenantId: tenantContext.tenantId, workspaceId: tenantContext.workspaceId } : null;
  const locksResult = executionIntegrityStore.listExecutionLocks(null, tenantScope);
  const recoveryQueueResult = executionIntegrityStore.listRecoveryQueue(null, tenantScope);
  const resumableExecutions = executionStateStore.getResumableExecutions().filter((execution: Record<string, unknown>) =>
    !tenantContext || String(execution.tenantId || "") === tenantContext.tenantId,
  );
  const activeLocks = (locksResult.ok ? locksResult.data : []).filter(isActiveLock);
  const staleLocks = activeLocks.filter((lock: Record<string, unknown>) => isStaleLock(lock, nowMs));
  const failureTelemetry = getFailureTelemetrySnapshot(tenantContext || null);
  const dependency = analyzeDependencyStability({
    startupReady: startupStatus?.ready ?? null,
    startupSummary: startupStatus?.summary ?? null,
    degradedDependencies: [],
    criticalFailures: Number(failureTelemetry["severity.catastrophic"] || 0),
  });
  const workerAvailability = trackWorkerAvailability({
    activeLocks: activeLocks.length,
    staleLocks: staleLocks.length,
    activeAttempts: activeLocks.length,
    stalledAttempts: staleLocks.length,
  });

  return {
    tenantId: tenantContext?.tenantId || null,
    workspaceId: tenantContext?.workspaceId || null,
    activeExecutions: resumableExecutions.length,
    staleLocks: staleLocks.length,
    activeLocks: activeLocks.length,
    recoveryBacklog: recoveryQueueResult.ok ? recoveryQueueResult.data.filter((item: Record<string, unknown>) => item.resolvedAt == null).length : 0,
    recoveryInProgress: recoveryQueueResult.ok ? recoveryQueueResult.data.some((item: Record<string, unknown>) => item.resolvedAt == null) : false,
    replayDivergenceDetected: detectReplayDivergence(tenantContext?.tenantId || null),
    workerAvailabilityScore: workerAvailability.score,
    dependencyStabilityScore: dependency.score,
    degradedDependencies: dependency.degradedDependencies,
    startupReady: startupStatus?.ready ?? null,
    startupSummary: startupStatus?.summary ?? null,
    criticalFailures: Number(failureTelemetry["severity.catastrophic"] || 0),
    disputedFailures: Number(failureTelemetry["classification.disputed"] || 0),
    degradedSubsystems: dependency.degradedDependencies.length + (workerAvailability.stalled ? 1 : 0),
    timestamp: new Date(nowMs).toISOString(),
  };
}
