import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validatePrivilegeBoundary } from "./privilegeBoundaryValidator";
import { detectAuthorityExpansion } from "./authorityExpansionDetector";
import { validateDelegationContainment } from "./delegationContainmentValidator";
import { detectCapabilityMutation } from "./capabilityMutationDetector";

export function eliminateAuthorityLeakage(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validatePrivilegeBoundary(input),
    ...detectAuthorityExpansion(input),
    ...validateDelegationContainment(input),
    ...detectCapabilityMutation(input),
  ]);
  return buildGateDomainCertification({
    domain: "authority_leakage",
    errors,
    hardInvalid: errors.length > 0,
  });
}
