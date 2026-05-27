import type { EscalationAwareCoordinationError, EscalationAwareCoordinationInput } from "@/types/escalation-aware-coordination";

function error(
  code: EscalationAwareCoordinationError["code"],
  message: string,
  path?: string,
): EscalationAwareCoordinationError {
  return Object.freeze({ code, message, path });
}

export function validateEscalationConsistency(input: EscalationAwareCoordinationInput): readonly EscalationAwareCoordinationError[] {
  const errors: EscalationAwareCoordinationError[] = [];
  if (!input.approval.valid || !input.approval.explicit || input.approval.status !== "approved") {
    errors.push(error(
      "ESCALATION_COORDINATION_APPROVAL_INCOMPLETE",
      "Escalation-aware coordination requires explicit valid approval ancestry.",
      "approval",
    ));
  }
  if (
    input.orchestrationRecord.containment.inheritedState === "fail_closed"
    || input.orchestrationRecord.validation.failClosed
  ) {
    errors.push(error(
      "ESCALATION_COORDINATION_CONTAINMENT_BYPASS",
      "Containment already failed closed and escalation cannot bypass it.",
      "orchestration.containment",
    ));
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("recursive")) {
    errors.push(error(
      "ESCALATION_COORDINATION_RECURSIVE_ESCALATION",
      "Recursive escalation lineage was detected.",
      "routing.lineage",
    ));
  }
  return Object.freeze(errors);
}
