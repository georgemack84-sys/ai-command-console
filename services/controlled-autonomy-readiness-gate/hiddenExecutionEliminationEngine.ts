import type { ControlledAutonomyDomainCertification, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { buildGateDomainCertification } from "./readinessClassificationEngine";
import { detectHiddenExecution } from "./hiddenExecutionDetector";
import { detectOrchestrationEmergence } from "./orchestrationEmergenceDetector";
import { detectSyntheticAuthority } from "./syntheticAuthorityDetector";
import { detectRuntimeMutation } from "./runtimeMutationDetector";

export function eliminateHiddenExecution(input: ControlledAutonomyReadinessGateInput): ControlledAutonomyDomainCertification {
  const errors = Object.freeze([
    ...detectHiddenExecution(input),
    ...detectOrchestrationEmergence(input),
    ...detectSyntheticAuthority(input),
    ...detectRuntimeMutation(input),
  ]);
  return buildGateDomainCertification({
    domain: "hidden_execution",
    errors,
    hardInvalid: errors.length > 0,
  });
}
