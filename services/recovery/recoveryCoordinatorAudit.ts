import { appendAuditEvent } from "../auditTrail.js";

export function appendRecoveryCoordinationAuditEvent({
  type,
  executionId,
  actorId,
  tenantId,
  workspaceId,
  payload,
}: {
  type: string;
  executionId: string;
  actorId?: string | null;
  tenantId?: string | null;
  workspaceId?: string | null;
  payload?: Record<string, unknown>;
}) {
  return appendAuditEvent({
    actor: "operator",
    type,
    message: `${type} for ${executionId}.`,
    payload: {
      executionId,
      actorId: actorId || null,
      tenantId: tenantId || null,
      workspaceId: workspaceId || null,
      ...payload,
    },
  });
}
