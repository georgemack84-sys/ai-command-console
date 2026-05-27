import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { validateApprovalDependencies } from "./approvalDependencyValidator";
import { verifyApprovalLineage } from "./approvalLineageVerifier";
import { verifyApprovalReplay } from "./approvalReplayVerifier";
import { certifyApprovalStability } from "./approvalStabilityEngine";

export function certifyApprovalCoordination(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...validateApprovalDependencies(input),
    ...verifyApprovalLineage(input),
    ...verifyApprovalReplay(input),
    ...certifyApprovalStability(input),
  ]);
  return buildGateDomainCertification({
    domain: "approval",
    errors,
    disputed: errors.some((item) => item.code.includes("REPLAY") || item.code.includes("LINEAGE")),
    frozen: errors.some((item) => item.code.includes("INHERITANCE")),
  });
}
