import { appendIntentValidationAudit } from "@/services/audit/intentValidationAudit";

export function appendPlannerAdmissionAudit(input: {
  intentId: string;
  eventType:
    | "INTENT_GOVERNANCE_VALIDATED"
    | "INTENT_GOVERNANCE_DENIED"
    | "INTENT_REPLAY_BLOCKED"
    | "INTENT_FREEZE_BLOCKED"
    | "INTENT_PROTECTED_TARGET_ESCALATED"
    | "INTENT_PLANNER_ADMISSION_DENIED"
    | "INTENT_GOVERNANCE_ESCALATED"
    | "INTENT_CONTAINMENT_REQUIRED";
  details: Record<string, unknown>;
}) {
  return appendIntentValidationAudit(input);
}
