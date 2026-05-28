import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { NormalizedPlan } from "../normalization";
import { createSimulationFailure } from "./simulation-errors";
import type { RollbackProjection, SimulationFailure } from "./simulation-types";

function requiresRollback(step: NormalizedPlan["steps"][number]) {
  return Boolean(step.inputs.isDestructive) || Boolean(step.inputs.hasExternalSideEffect);
}

export function buildRollbackProjection(
  normalizedPlan: NormalizedPlan,
  executionCompatibilityContract: ExecutionCompatibilityContract,
): {
  projection: readonly RollbackProjection[];
  failures: readonly SimulationFailure[];
} {
  const contracts = new Map(
    executionCompatibilityContract.rollbackContracts.map((contract) => [contract.stepId, contract]),
  );
  const failures: SimulationFailure[] = [];
  const projection: RollbackProjection[] = [];

  for (const step of normalizedPlan.steps) {
    const contract = contracts.get(step.id);
    const rollbackRequired = requiresRollback(step);

    if (rollbackRequired && !contract) {
      failures.push(createSimulationFailure(
        "SIMULATION_ROLLBACK_INVALID",
        `Step ${step.id} requires rollback metadata for simulation projection.`,
        `steps.${step.id}.inputs.compatibility.rollback`,
      ));
      projection.push({
        stepId: step.id,
        available: false,
        required: true,
        reason: "Rollback metadata missing.",
      });
      continue;
    }

    projection.push({
      stepId: step.id,
      available: Boolean(contract) && (contract?.required ? Boolean(contract.rollbackStrategy) || contract.checkpointRequired : true),
      required: rollbackRequired || Boolean(contract?.required),
      reason: contract?.required && !contract.rollbackStrategy && !contract.checkpointRequired
        ? "Rollback contract does not describe a projection strategy."
        : undefined,
    });

    if (contract?.required && !contract.rollbackStrategy && !contract.checkpointRequired) {
      failures.push(createSimulationFailure(
        "SIMULATION_ROLLBACK_INVALID",
        `Rollback contract for ${step.id} is required but lacks a deterministic rollback projection.`,
        `rollbackContracts.${step.id}`,
      ));
    }
  }

  return {
    projection,
    failures,
  };
}
