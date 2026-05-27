import { appendPlanAudit } from "./planAudit";

export function appendPlanLifecycleAudit(input: {
  planId: string;
  eventType: string;
  details: Record<string, unknown>;
}) {
  return appendPlanAudit(input);
}
