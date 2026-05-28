import { clampMetric } from "../stability/stabilityMetrics";

export function buildGovernanceTelemetry(input: {
  governanceConfidence: number;
  deniedOperations: number;
  containmentTriggers: number;
  escalationTriggers: number;
  emergencyGovernanceActivations: number;
  timestamp: string;
}) {
  return [
    { metric: "governance_decisions", value: clampMetric(input.governanceConfidence, 0), timestamp: input.timestamp },
    { metric: "denied_operations", value: clampMetric(input.deniedOperations, 0), timestamp: input.timestamp },
    { metric: "containment_triggers", value: clampMetric(input.containmentTriggers, 0), timestamp: input.timestamp },
    { metric: "escalation_triggers", value: clampMetric(input.escalationTriggers, 0), timestamp: input.timestamp },
    { metric: "emergency_governance_activations", value: clampMetric(input.emergencyGovernanceActivations, 0), timestamp: input.timestamp },
  ];
}
