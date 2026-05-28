import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { verifyEscalationLineage } from "./escalationLineageVerifier";
import { validateUncertaintyEscalation } from "./uncertaintyEscalationValidator";
import { shouldFreezeEscalation } from "./escalationFreezeCoordinator";
import { shouldFailClosedEscalation } from "./escalationFailClosedCoordinator";

export function certifyEscalationDeterminism(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...verifyEscalationLineage(input),
    ...validateUncertaintyEscalation(input),
  ]);
  return buildGateDomainCertification({
    domain: "escalation",
    errors,
    frozen: shouldFreezeEscalation(errors),
    disputed: shouldFailClosedEscalation(errors) && !shouldFreezeEscalation(errors),
  });
}
