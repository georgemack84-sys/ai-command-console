/**
 * Future agent outputs are data only. They cannot mutate alarms, timers, or
 * any other authoritative service. Governance will own proposed actions.
 */
export interface AgentObservation {
  agent: "ambient" | "context" | "attention" | "rhythm";
  timestamp: string;
  contextId: string;
  confidence?: number;
}
