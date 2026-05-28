import type { EscalationAuthorityContract, EscalationDecision, EscalationError } from "@/types/escalation";
import { createEscalationError } from "./escalationBoundaryEnforcer";

export function evaluateEscalationContainment(input: {
  authorityContract: EscalationAuthorityContract;
  decision: EscalationDecision;
}): readonly EscalationError[] {
  const errors: EscalationError[] = [];
  if (Object.values(input.authorityContract).some((value) => value !== false)) {
    errors.push(createEscalationError(
      "ESCALATION_EXECUTION_LEAK_REJECTED",
      "Escalation containment must not carry operational authority.",
      "authorityContract",
    ));
  }
  if (!input.decision.governanceValidated && input.decision.resultingState !== "fail_closed") {
    errors.push(createEscalationError(
      "ESCALATION_GOVERNANCE_MISMATCH",
      "Governance uncertainty must fail closed or remain frozen/restricted.",
      "decision.governanceValidated",
    ));
  }
  return Object.freeze(errors);
}
