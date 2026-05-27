import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validateGovernanceSupremacy } from "./governanceSupremacyValidator";
import { validateGovernanceFreeze } from "./governanceFreezeValidator";
import { verifyGovernanceLineage } from "./governanceLineageVerifier";
import { enforceGovernanceBoundary } from "./governanceBoundaryEnforcer";

export function certifyGovernanceImmutability(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validateGovernanceSupremacy(input),
    ...validateGovernanceFreeze(input),
    ...verifyGovernanceLineage(input),
    ...enforceGovernanceBoundary(input),
  ]);
  return buildGateDomainCertification({
    domain: "governance",
    errors,
    frozen: errors.length > 0,
  });
}
