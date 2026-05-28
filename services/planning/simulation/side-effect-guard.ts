import type { NormalizedPlanStep } from "../normalization";
import { createSimulationFailure } from "./simulation-errors";
import type {
  BlockedSimulationOperation,
  SideEffectCategory,
  SimulationAdapterContract,
  SimulationFailure,
} from "./simulation-types";

function readSideEffectCategories(step: NormalizedPlanStep): SideEffectCategory[] {
  const raw = step.inputs.simulation;
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const categories = (raw as { sideEffectCategories?: unknown }).sideEffectCategories;
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories.filter((category): category is SideEffectCategory => typeof category === "string");
}

export function guardSimulationSideEffects(
  step: NormalizedPlanStep,
  adapter: SimulationAdapterContract,
): {
  failures: readonly SimulationFailure[];
  blockedOperations: readonly BlockedSimulationOperation[];
} {
  const categories = readSideEffectCategories(step);
  const failures: SimulationFailure[] = [];
  const blockedOperations: BlockedSimulationOperation[] = [];

  if (!adapter.sideEffectFree) {
    failures.push(createSimulationFailure(
      "SIMULATION_SIDE_EFFECT_DETECTED",
      `Adapter ${adapter.toolId} is not marked side-effect-free for simulation.`,
      `steps.${step.id}.action.tool`,
    ));
    blockedOperations.push({
      stepId: step.id,
      toolId: adapter.toolId,
      category: "execution-start",
      reason: `Adapter ${adapter.toolId} is not side-effect-free.`,
    });
  }

  for (const category of categories) {
    failures.push(createSimulationFailure(
      "SIMULATION_SIDE_EFFECT_DETECTED",
      `Simulation blocked a side-effect category: ${category}.`,
      `steps.${step.id}.inputs.simulation.sideEffectCategories`,
    ));
    blockedOperations.push({
      stepId: step.id,
      toolId: adapter.toolId,
      category,
      reason: `Blocked side-effect category ${category}.`,
    });
  }

  return {
    failures,
    blockedOperations,
  };
}
