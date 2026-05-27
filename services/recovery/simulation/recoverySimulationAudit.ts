// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendAuditEvent } = require("../../auditTrail.js");

export function appendRecoverySimulationAuditTrail({
  simulationId,
  executionId,
  tenantId,
  workspaceId,
  events,
}: {
  simulationId: string;
  executionId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  events: Array<{ type: string; payload?: Record<string, unknown> }>;
}) {
  return events.map((event) => appendAuditEvent({
    actor: "system",
    type: event.type,
    message: `${event.type} recorded for recovery simulation.`,
    payload: {
      simulationId,
      executionId,
      tenantId: tenantId || null,
      workspaceId: workspaceId || null,
      dryRun: true,
      simulationScoped: true,
      ...event.payload,
    },
  }));
}
