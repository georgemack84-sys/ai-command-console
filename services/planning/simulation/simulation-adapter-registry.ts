import type { SimulationAdapterContract, SimulationAdapterRegistry } from "./simulation-types";

const DEFAULT_ADAPTERS: Record<string, SimulationAdapterContract> = {
  read_file: {
    toolId: "read_file",
    supportsSimulation: true,
    supportsDryRun: true,
    sideEffectFree: true,
  },
  inspect_runtime: {
    toolId: "inspect_runtime",
    supportsSimulation: true,
    supportsDryRun: true,
    sideEffectFree: true,
  },
  planner: {
    toolId: "planner",
    supportsSimulation: true,
    supportsDryRun: true,
    sideEffectFree: true,
  },
};

export function createSimulationAdapterRegistry(
  adapters: Record<string, SimulationAdapterContract> = DEFAULT_ADAPTERS,
): SimulationAdapterRegistry {
  return {
    adapters: Object.freeze({ ...adapters }),
  };
}

export function resolveSimulationAdapter(
  registry: SimulationAdapterRegistry,
  toolId: string,
): SimulationAdapterContract | undefined {
  return registry.adapters[toolId];
}
