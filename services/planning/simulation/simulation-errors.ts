import type { SimulationFailure, SimulationFailureCode } from "./simulation-types";

export function createSimulationFailure(
  code: SimulationFailureCode,
  message: string,
  path?: string,
): SimulationFailure {
  return {
    code,
    message,
    path,
  };
}
