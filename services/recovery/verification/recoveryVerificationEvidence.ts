// eslint-disable-next-line @typescript-eslint/no-require-imports
const { listAuditEvents } = require("../../auditTrail.js");

import { getRuntimeContinuityState } from "../../runtime/runtimeContinuityState";
import { listRecoveryVerificationsForExecution } from "../../recoveryVerification/verificationLedger";
import type { TenantContext } from "../../tenancy/tenantTypes";
import type { StoredSimulationSummary } from "./recoveryVerificationTypes";

function mapSimulationOutcome(outcomeEvent: Record<string, unknown>, evidenceEvents: Array<Record<string, unknown>>): StoredSimulationSummary {
  const payload = (outcomeEvent.payload || {}) as Record<string, unknown>;
  const evidenceIds = evidenceEvents.flatMap((event) => {
    const eventPayload = (event.payload || {}) as Record<string, unknown>;
    return Array.isArray(eventPayload.evidenceIds) ? eventPayload.evidenceIds.map((id) => String(id)) : [];
  });
  return {
    simulationId: String(payload.simulationId || ""),
    executionId: String(payload.executionId || ""),
    scenarioType: String(payload.scenarioType || "UNKNOWN") as StoredSimulationSummary["scenarioType"],
    state:
      String(outcomeEvent.type || "").includes("contained") ? "CONTAINED"
        : String(outcomeEvent.type || "").includes("blocked") ? "BLOCKED"
          : String(outcomeEvent.type || "").includes("failed") ? "FAILED"
            : String(outcomeEvent.type || "").includes("disputed") ? "DISPUTED"
              : "COMPLETED",
    outcome: String(payload.outcome || "SIMULATION_FAILED") as StoredSimulationSummary["outcome"],
    warnings: [],
    disputes: [],
    evidenceIds,
    auditEventIds: [String(outcomeEvent.id || "")],
    timestamp: String(outcomeEvent.timestamp || ""),
    recommendedAction: String(payload.recommendedAction || "BLOCK_RECOVERY_PATTERN") as StoredSimulationSummary["recommendedAction"],
    dryRun: true,
  };
}

export function listStoredSimulationSummaries({ tenantContext, executionId }: { tenantContext: TenantContext; executionId?: string }) {
  const relevantTypes = new Set([
    "simulation.completed",
    "simulation.failed",
    "simulation.disputed",
    "simulation.blocked",
    "simulation.contained",
    "simulation.evidence.generated",
  ]);
  const auditEvents: Array<Record<string, unknown>> = listAuditEvents(5000)
    .filter((event: Record<string, unknown>) => relevantTypes.has(String(event.type || "")))
    .filter((event: Record<string, unknown>) => {
      const payload = (event.payload || {}) as Record<string, unknown>;
      return payload.tenantId === tenantContext.tenantId && payload.workspaceId === tenantContext.workspaceId;
    })
    .filter((event: Record<string, unknown>) => {
      if (!executionId) return true;
      const payload = (event.payload || {}) as Record<string, unknown>;
      return String(payload.executionId || "") === executionId;
    });

  const bySimulation = new Map<string, Array<Record<string, unknown>>>();
  for (const event of auditEvents) {
    const simulationId = String(((event.payload || {}) as Record<string, unknown>).simulationId || "");
    if (!simulationId) continue;
    bySimulation.set(simulationId, [...(bySimulation.get(simulationId) || []), event]);
  }

  return Array.from(bySimulation.values())
    .map((events) => {
      const outcomeEvent = events.find((event) => String(event.type || "").startsWith("simulation.") && !String(event.type || "").includes("evidence.generated"));
      if (!outcomeEvent) return null;
      return mapSimulationOutcome(
        outcomeEvent,
        events.filter((event) => String(event.type || "") === "simulation.evidence.generated"),
      );
    })
    .filter((value): value is StoredSimulationSummary => value !== null)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

export function collectStoredRecoveryVerificationEvidence({
  executionId,
  tenantContext,
}: {
  executionId: string;
  tenantContext: TenantContext;
}) {
  const replayVerification = listRecoveryVerificationsForExecution(executionId)[0] || null;
  const simulationResult = listStoredSimulationSummaries({ tenantContext, executionId })[0] || null;
  const continuityStateResult = getRuntimeContinuityState({ tenantContext, persistSnapshot: false });
  const auditEvents = listAuditEvents(5000).filter((event: Record<string, unknown>) => {
    const payload = (event.payload || {}) as Record<string, unknown>;
    return payload.tenantId === tenantContext.tenantId
      && payload.workspaceId === tenantContext.workspaceId
      && String(payload.executionId || "") === executionId;
  });
  const immutableEvidenceValid = auditEvents.every((event: Record<string, unknown>) => String(event.type || "") !== "parse_error");

  return {
    replayVerification,
    simulationResult,
    continuityState: continuityStateResult.ok ? continuityStateResult.data : null,
    immutableEvidenceValid,
    governanceDenied: auditEvents.some((event: Record<string, unknown>) => String(event.type || "").includes("governance.blocked")),
    auditEvents,
  };
}
