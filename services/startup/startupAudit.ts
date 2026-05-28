import * as auditTrail from "../auditTrail.js";
import { redactConfig } from "./redactConfig";

export function appendStartupAuditEvent({
  type,
  payload,
}: {
  type: string;
  payload: Record<string, unknown>;
}) {
  return auditTrail.appendAuditEvent({
    actor: "system",
    type,
    message: `Startup event: ${type}`,
    payload: redactConfig(payload),
  });
}
