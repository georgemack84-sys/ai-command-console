import { clampMetric } from "../stability/stabilityMetrics";

export function buildAutonomyTelemetry(input: {
  coordinationHealth: number;
  governancePressure: number;
  escalationSaturation: number;
  coordinationConflicts: number;
  survivabilityDegradation: number;
  timestamp: string;
}) {
  return [
    { metric: "coordination_health", value: clampMetric(input.coordinationHealth, 0), timestamp: input.timestamp },
    { metric: "governance_pressure", value: clampMetric(input.governancePressure, 0), timestamp: input.timestamp },
    { metric: "escalation_saturation", value: clampMetric(input.escalationSaturation, 0), timestamp: input.timestamp },
    { metric: "coordination_conflicts", value: clampMetric(input.coordinationConflicts, 0), timestamp: input.timestamp },
    { metric: "survivability_degradation", value: clampMetric(input.survivabilityDegradation, 0), timestamp: input.timestamp },
  ];
}

export function buildSupervisionTelemetry(input: {
  runtimeHealth: number;
  operationalRisk: number;
  escalationPressure: number;
  stabilizationSignal: number;
  timestamp: string;
}) {
  return [
    { metric: "runtime_health", value: clampMetric(input.runtimeHealth, 0), timestamp: input.timestamp },
    { metric: "operational_risk", value: clampMetric(input.operationalRisk, 0), timestamp: input.timestamp },
    { metric: "escalation_pressure", value: clampMetric(input.escalationPressure, 0), timestamp: input.timestamp },
    { metric: "stabilization_signal", value: clampMetric(input.stabilizationSignal, 0), timestamp: input.timestamp },
  ];
}
