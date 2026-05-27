export function buildContainmentAuditRecord(input: {
  containmentState: string;
  recommendedAction: string;
  isolatedDomains: string[];
  quarantinedDomains: string[];
  timestamp: string;
}) {
  return {
    auditRef: `containment:${input.containmentState.toLowerCase()}:${input.timestamp}`,
    containmentState: input.containmentState,
    recommendedAction: input.recommendedAction,
    isolatedDomains: input.isolatedDomains,
    quarantinedDomains: input.quarantinedDomains,
    timestamp: input.timestamp,
  };
}
