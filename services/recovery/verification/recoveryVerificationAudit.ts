// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendAuditEvent } = require("../../auditTrail.js");

export function appendGovernedRecoveryVerificationAudit({
  type,
  executionId,
  tenantId,
  workspaceId,
  payload = {},
}: {
  type: string;
  executionId: string;
  tenantId?: string | null;
  workspaceId?: string | null;
  payload?: Record<string, unknown>;
}) {
  return appendAuditEvent({
    actor: "system",
    type,
    message: `${type} for ${executionId}.`,
    payload: {
      executionId,
      tenantId: tenantId || null,
      workspaceId: workspaceId || null,
      ...payload,
    },
  });
}
