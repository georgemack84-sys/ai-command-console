export function buildCivilizationSupervision(input: {
  blockedAutonomy: string[];
  disputedOperations: string[];
  operatorInterventions: string[];
  createdAt: number;
}) {
  return {
    supervisionId: `civilization-supervision:${input.createdAt}`,
    blockedAutonomy: input.blockedAutonomy,
    disputedOperations: input.disputedOperations,
    operatorInterventions: input.operatorInterventions,
    advisoryOnly: true as const,
  };
}
