import type { EscalationType } from "./contracts/escalationTypes";

export function requireEscalationVisibility({
  escalationType,
  blocked,
}: {
  escalationType: EscalationType;
  blocked: boolean;
}) {
  return {
    requiresOperatorVisibility: true,
    reasons: Array.from(new Set([
      "operator_visibility_required",
      ...(blocked ? ["blocked_escalation_must_remain_visible"] : []),
      ...( ["governance", "constitutional", "containment", "emergency"].includes(escalationType)
        ? ["critical_escalation_visibility_required"]
        : []),
    ])),
  };
}
