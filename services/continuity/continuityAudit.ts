export function buildContinuityAuditRecord(input: {
  eventType: "continuity.assessed" | "continuity.forecast.generated" | "continuity.risk.detected";
  reasoning: string[];
  evidenceRefs?: string[];
  timestamp: string;
}) {
  return {
    eventType: input.eventType,
    reasoning: [...input.reasoning],
    evidenceRefs: [...(input.evidenceRefs || [])],
    timestamp: input.timestamp,
  };
}
