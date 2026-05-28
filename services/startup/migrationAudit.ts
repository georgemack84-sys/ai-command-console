import * as auditTrail from "../auditTrail.js";

export function appendMigrationAuditEvent(event: Record<string, unknown>) {
  return auditTrail.appendAuditEvent({
    actor: "system",
    type: "STARTUP_MIGRATION_CHECK",
    message: "Startup migration readiness evaluated.",
    payload: event,
  });
}
