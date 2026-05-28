import type { SimulationThresholds } from "./simulationTypes";

export function getSimulationThresholds(): SimulationThresholds {
  return {
    severeRiskThreshold: 0.78,
    degradedConfidenceThreshold: 0.55,
    severeUncertaintyThreshold: 0.35,
  };
}
