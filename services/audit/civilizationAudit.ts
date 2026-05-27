export function buildCivilizationAudit(input: {
  sovereigntyState: string;
  validationState: string;
  viewedSystems: string[];
  createdAt: number;
}) {
  return {
    auditId: `civilization-audit:${input.createdAt}`,
    sovereigntyState: input.sovereigntyState,
    validationState: input.validationState,
    viewedSystems: [...new Set(input.viewedSystems)].sort(),
    appendOnly: true as const,
    advisoryOnly: true as const,
    createdAt: input.createdAt,
  };
}
