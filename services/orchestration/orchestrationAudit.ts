export function buildOrchestrationAuditRecord(input: {
  eventType: "orchestration.denied" | "orchestration.allowed" | "orchestration.locked";
  requestType: string;
  constitutionalState: string;
  reasoning: string[];
  timestamp: string;
}) {
  return {
    eventType: input.eventType,
    requestType: input.requestType,
    constitutionalState: input.constitutionalState,
    reasoning: [...input.reasoning],
    timestamp: input.timestamp,
  };
}
