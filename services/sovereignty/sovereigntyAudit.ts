export function buildSovereigntyAudit(input: {
  assessment: {
    sovereigntyState: string;
    constitutionalSafe: boolean;
  };
  lineageId: string;
  createdAt: number;
}) {
  return {
    auditId: `sovereignty-audit:${input.createdAt}`,
    sovereigntyState: input.assessment.sovereigntyState,
    constitutionalSafe: input.assessment.constitutionalSafe,
    lineageId: input.lineageId,
    advisoryOnly: true as const,
    immutable: true as const,
    createdAt: input.createdAt,
  };
}
