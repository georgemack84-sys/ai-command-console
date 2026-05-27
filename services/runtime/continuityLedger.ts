// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendAuditEvent, listAuditEvents } = require("../auditTrail.js");
import type { ContinuitySnapshot } from "./runtimeContinuityTypes";
import { hashPayloadDeterministically } from "../contracts/payloadHasher";

function mapContinuitySnapshot(event: Record<string, unknown>): ContinuitySnapshot | null {
  if (String(event?.type || "") !== "runtime.continuity.snapshot") {
    return null;
  }
  const payload = (event?.payload || {}) as Record<string, unknown>;
  return {
    snapshotId: String(payload.snapshotId || event.id || ""),
    tenantId: payload.tenantId == null ? null : String(payload.tenantId),
    workspaceId: payload.workspaceId == null ? null : String(payload.workspaceId),
    runtimeState: String(payload.runtimeState || "FAILED"),
    activeExecutions: Number(payload.activeExecutions || 0),
    degradedDependencies: Array.isArray(payload.degradedDependencies) ? payload.degradedDependencies.map((value) => String(value)) : [],
    staleLocks: Number(payload.staleLocks || 0),
    recoveryInProgress: Boolean(payload.recoveryInProgress),
    continuityRiskScore: Number(payload.continuityRiskScore || 0),
    survivabilityScore: Number(payload.survivabilityScore || 0),
    replayDivergenceDetected: Boolean(payload.replayDivergenceDetected),
    workerAvailabilityScore: Number(payload.workerAvailabilityScore || 0),
    dependencyStabilityScore: Number(payload.dependencyStabilityScore || 0),
    timestamp: String(payload.timestamp || event.timestamp || ""),
  };
}

export function appendContinuitySnapshot(snapshot: Omit<ContinuitySnapshot, "snapshotId"> & { snapshotId?: string }) {
  const snapshotId = snapshot.snapshotId || `continuity_${hashPayloadDeterministically(snapshot)}`;
  appendAuditEvent({
    actor: "system",
    type: "runtime.continuity.snapshot",
    message: `Runtime continuity snapshot ${snapshotId} recorded.`,
    payload: {
      snapshotId,
      tenantId: snapshot.tenantId || null,
      workspaceId: snapshot.workspaceId || null,
      runtimeState: snapshot.runtimeState,
      activeExecutions: snapshot.activeExecutions,
      degradedDependencies: [...snapshot.degradedDependencies],
      staleLocks: snapshot.staleLocks,
      recoveryInProgress: snapshot.recoveryInProgress,
      continuityRiskScore: snapshot.continuityRiskScore,
      survivabilityScore: snapshot.survivabilityScore,
      replayDivergenceDetected: snapshot.replayDivergenceDetected,
      workerAvailabilityScore: snapshot.workerAvailabilityScore,
      dependencyStabilityScore: snapshot.dependencyStabilityScore,
      timestamp: snapshot.timestamp,
    },
  });
  return snapshotId;
}

export function listContinuitySnapshots({
  tenantId,
  limit = 20,
}: {
  tenantId?: string | null;
  limit?: number;
} = {}) {
  const snapshots: ContinuitySnapshot[] = listAuditEvents(5000)
    .map((event: Record<string, unknown>) => mapContinuitySnapshot(event))
    .filter((snapshot: ContinuitySnapshot | null): snapshot is ContinuitySnapshot => snapshot !== null);

  return snapshots
    .filter((snapshot: ContinuitySnapshot) => !tenantId || snapshot.tenantId === tenantId)
    .reverse()
    .slice(-Math.max(1, Number(limit || 20)));
}

export function getContinuitySnapshot(snapshotId: string) {
  return listContinuitySnapshots({ limit: 5000 }).find((snapshot: ContinuitySnapshot) => snapshot.snapshotId === String(snapshotId || "").trim()) || null;
}

export function getLatestContinuitySnapshot(tenantId?: string | null) {
  const snapshots = listContinuitySnapshots({ tenantId, limit: 1 });
  return snapshots[0] || null;
}
