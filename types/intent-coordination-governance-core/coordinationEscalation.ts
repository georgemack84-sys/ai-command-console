export type CoordinationEscalationGovernance = Readonly<{
  governanceId: string;
  escalationSeverity: string;
  recommendationType: string;
  oversightOnly: true;
  executionAuthority: false;
  maxEscalationEdges: number;
  maxEscalationDepth: number;
  overrideSupremacyRequired: true;
  createdAt: string;
}>;
