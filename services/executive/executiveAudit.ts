export type ExecutiveDashboardAuditRecord = {
  auditId: string;
  operatorId: string;
  viewedPanels: string[];
  triggeredActions: string[];
  survivabilityState: string;
  governanceSafe: boolean;
  containmentState: string;
  createdAt: number;
};

export function buildExecutiveDashboardAuditRecord(input: {
  operatorId: string;
  viewedPanels: string[];
  survivabilityState: string;
  governanceSafe: boolean;
  containmentState: string;
  createdAt: number;
}) : ExecutiveDashboardAuditRecord {
  return {
    auditId: `executive-audit:${input.operatorId}:${input.createdAt}`,
    operatorId: input.operatorId,
    viewedPanels: Array.from(new Set(input.viewedPanels)),
    triggeredActions: [],
    survivabilityState: input.survivabilityState,
    governanceSafe: input.governanceSafe,
    containmentState: input.containmentState,
    createdAt: input.createdAt,
  };
}
