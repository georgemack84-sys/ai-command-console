import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationContainmentState,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function analyzeSimulationContainmentPressure(input: {
  simulationInput: ConstitutionalRuntimeSimulationInput;
  signals: readonly SimulationSignal[];
}): SimulationContainmentState {
  const pressure = input.signals.reduce((total, signal) => {
    if (!signal.triggered) {
      return total;
    }
    switch (signal.severity) {
      case "critical":
        return total + 20;
      case "high":
        return total + 12;
      case "moderate":
        return total + 6;
      default:
        return total;
    }
  }, 0);
  const authorityIncreaseDetected = input.signals.some((signal) =>
    signal.domain === "containment_pressure"
      && signal.triggered
      && signal.reason.toLowerCase().includes("authority"));
  return Object.freeze({
    containmentPressureScore: Math.min(100, pressure),
    oversightIncreased: pressure > 0,
    authorityIncreaseDetected,
    containmentHash: hashSimulationValue("constitutional-runtime-simulation-containment", {
      pressure,
      authorityIncreaseDetected,
    }),
  });
}
