import { appendIntentAudit } from "@/services/intent/intentAuditAppender";

export function appendIntentValidationAudit(input: {
  intentId: string;
  eventType:
    | "intent.validation.started"
    | "intent.validation.succeeded"
    | "intent.validation.failed"
    | "intent.registry.matched"
    | "intent.registry.denied"
    | "intent.governance.denied"
    | "intent.parameters.blocked"
    | "intent.planner.eligible"
    | "intent.planner.denied"
    | "intent.freeze.blocked"
    | "intent.replay.drift_detected"
    | "intent.semantic.denied"
    | "intent.semantic.conflict"
    | "intent.semantic.ambiguity"
    | "intent.semantic.protected_target"
    | "intent.semantic.escalated"
    | "INTENT_CONTEXT_RESOLVED"
    | "INTENT_CONTEXT_INSUFFICIENT"
    | "INTENT_CLARIFICATION_GENERATED"
    | "INTENT_AMBIGUITY_ESCALATED"
    | "INTENT_NORMALIZED"
    | "INTENT_PLANNER_ADMISSION_DENIED"
    | "INTENT_UNSAFE_ASSUMPTION_BLOCKED"
    | "INTENT_FINALIZED"
    | "INTENT_GOVERNANCE_VALIDATED"
    | "INTENT_GOVERNANCE_DENIED"
    | "INTENT_REPLAY_BLOCKED"
    | "INTENT_FREEZE_BLOCKED"
    | "INTENT_PROTECTED_TARGET_ESCALATED"
    | "INTENT_GOVERNANCE_ESCALATED"
    | "INTENT_CONTAINMENT_REQUIRED";
  details: Record<string, unknown>;
}) {
  return appendIntentAudit(input);
}
