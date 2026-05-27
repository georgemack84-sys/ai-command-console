import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { simulateEscalationPropagation } from "./escalationPropagationSimulator";
import { simulateAuthorityRevocation } from "./authorityRevocationSimulator";
import { simulateCoordinationStress } from "./coordinationStressSimulator";
import { simulateGovernanceConflict } from "./governanceConflictSimulator";
import { simulateReplayFailure } from "./replayFailureSimulator";
import { simulateOperatorIntervention } from "./simulationOperatorInterventionCoordinator";
import { simulateRuntimeInstability } from "./runtimeInstabilitySimulator";
import { simulateContainmentPressure } from "./containmentSimulator";

export function runAutonomyStressFramework(
  input: ConstitutionalRuntimeSimulationInput,
): readonly SimulationSignal[] {
  return Object.freeze([
    simulateEscalationPropagation(input),
    simulateAuthorityRevocation(input),
    simulateCoordinationStress(input),
    simulateGovernanceConflict(input),
    simulateReplayFailure(input),
    simulateOperatorIntervention(input),
    simulateRuntimeInstability(input),
    simulateContainmentPressure(input),
  ]);
}
