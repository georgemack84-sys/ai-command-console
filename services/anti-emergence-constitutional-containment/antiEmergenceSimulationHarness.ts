import type { AntiEmergenceInput, EmergenceSignal } from "./antiEmergenceStateTypes";
import {
  detectWorkflowSynthesis,
} from "./workflowSynthesisValidator";
import { detectRecursiveCoordination } from "./recursiveCoordinationDetector";
import { detectOrchestrationDrift } from "./orchestrationDriftDetector";
import { detectAuthorityExpansion } from "./authorityExpansionDetector";
import { detectHiddenRetry } from "./hiddenRetryDetector";
import { detectInvisibleScheduling } from "./invisibleSchedulingValidator";
import { detectTopologyMutation } from "./topologyBoundaryEngine";
import { detectGovernanceDetachment } from "./governanceDetachmentDetector";
import { detectFanoutExpansion } from "./coordinationFanoutValidator";

export function runAntiEmergenceSimulation(input: AntiEmergenceInput): readonly EmergenceSignal[] {
  return Object.freeze([
    detectOrchestrationDrift(input),
    detectRecursiveCoordination(input),
    detectAuthorityExpansion(input),
    detectHiddenRetry(input),
    detectInvisibleScheduling(input),
    detectTopologyMutation(input),
    detectWorkflowSynthesis(input),
    detectGovernanceDetachment(input),
    detectFanoutExpansion(input),
  ]);
}
