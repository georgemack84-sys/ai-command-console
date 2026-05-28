import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { detectRecursiveWorkflow } from "./recursiveWorkflowDetector";
import { detectOrchestrationLoop } from "./orchestrationLoopDetector";
import { detectRecursiveEscalation } from "./recursiveEscalationDetector";
import { detectRecursiveApproval } from "./recursiveApprovalDetector";

export function proveRecursiveCoordinationAbsence(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...detectRecursiveWorkflow(input),
    ...detectOrchestrationLoop(input),
    ...detectRecursiveEscalation(input),
    ...detectRecursiveApproval(input),
  ]);
  return buildGateDomainCertification({
    domain: "recursive_coordination",
    errors,
    hardInvalid: errors.length > 0,
  });
}
