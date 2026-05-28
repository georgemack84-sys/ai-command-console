import { clampMetric } from "../stability/stabilityMetrics";

export function buildOrchestrationTelemetry(input: {
  governanceConfidence: number;
  deniedOperations: number;
  escalationTriggers: number;
  containmentTriggers: number;
  arbitrationOutcome: number;
  supervisionConfidence: number;
  timestamp: string;
}) {
  return [
    { metric: "governance_decisions", value: clampMetric(input.governanceConfidence, 0), timestamp: input.timestamp },
    { metric: "denied_operations", value: clampMetric(input.deniedOperations, 0), timestamp: input.timestamp },
    { metric: "escalation_triggers", value: clampMetric(input.escalationTriggers, 0), timestamp: input.timestamp },
    { metric: "containment_triggers", value: clampMetric(input.containmentTriggers, 0), timestamp: input.timestamp },
    { metric: "arbitration_outcomes", value: clampMetric(input.arbitrationOutcome, 0), timestamp: input.timestamp },
    { metric: "supervision_confidence", value: clampMetric(input.supervisionConfidence, 0), timestamp: input.timestamp },
  ];
}
