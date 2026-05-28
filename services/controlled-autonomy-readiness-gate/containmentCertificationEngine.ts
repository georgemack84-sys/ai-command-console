import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validateOrchestrationContainment } from "./orchestrationContainmentValidator";
import { validateAuthorityContainment } from "./authorityContainmentValidator";
import { verifyBoundaryContainment } from "./boundaryContainmentVerifier";
import { validateAntiExpansion } from "./antiExpansionValidator";

export function certifyContainment(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validateOrchestrationContainment(input),
    ...validateAuthorityContainment(input),
    ...verifyBoundaryContainment(input),
    ...validateAntiExpansion(input),
  ]);
  return buildGateDomainCertification({
    domain: "containment",
    errors,
    frozen: errors.length > 0,
  });
}
