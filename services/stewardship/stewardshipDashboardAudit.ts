import type { SupervisoryControlView } from "./supervisoryControlView";

export function buildStewardshipDashboardAudit(view: SupervisoryControlView) {
  return {
    eventType: "stewardship.dashboard.derived",
    generatedAt: view.generatedAt,
    resilienceState: view.resilience.resilienceState,
    evidence: [
      ...view.recoveryStewardship.recoveryPriorityOrder.slice(0, 3),
      ...view.escalationGovernance.escalationLineage.slice(0, 2),
    ],
  };
}
