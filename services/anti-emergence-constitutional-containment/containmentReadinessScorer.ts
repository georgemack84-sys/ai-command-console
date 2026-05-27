import type {
  EmergenceClassification,
  EmergenceSignal,
} from "./antiEmergenceStateTypes";

export function scoreContainmentReadiness(signals: readonly EmergenceSignal[]): EmergenceClassification {
  if (signals.some((signal) => signal.triggered && signal.severity === "critical")) {
    return "frozen";
  }
  if (signals.some((signal) => signal.triggered && signal.severity === "high")) {
    return "elevated";
  }
  return "contained";
}
