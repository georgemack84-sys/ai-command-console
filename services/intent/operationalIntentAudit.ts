import { appendIntentValidationAudit } from "@/services/audit/intentValidationAudit";

export function appendOperationalIntentAudit(input: {
  intentId: string;
  eventType:
    | "INTENT_CONTEXT_RESOLVED"
    | "INTENT_CONTEXT_INSUFFICIENT"
    | "INTENT_CLARIFICATION_GENERATED"
    | "INTENT_AMBIGUITY_ESCALATED"
    | "INTENT_NORMALIZED"
    | "INTENT_PLANNER_ADMISSION_DENIED"
    | "INTENT_UNSAFE_ASSUMPTION_BLOCKED"
    | "INTENT_FINALIZED";
  details: Record<string, unknown>;
}) {
  return appendIntentValidationAudit(input);
}
