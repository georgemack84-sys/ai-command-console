// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendAuditEvent } = require("../../auditTrail.js");

export function appendRecoveryGovernanceAuditEvent({
  type,
  executionId,
  payload = {},
}: {
  type: string;
  executionId: string;
  payload?: Record<string, unknown>;
}) {
  return appendAuditEvent({
    actor: "system",
    type,
    message: `${type} recorded for recovery governance.`,
    payload: {
      executionId,
      ...payload,
    },
  });
}
