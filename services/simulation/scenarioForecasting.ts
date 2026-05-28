import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";

export const CONSTITUTIONAL_SIMULATION_TYPES = [
  "governance_conflict",
  "continuity_collapse",
  "escalation_cascade",
  "containment_failure",
  "operational_survivability",
  "recovery_saturation",
  "tenant_isolation",
  "constitutional_violation",
  "dependency_collapse",
  "operator_intervention",
] as const;

export type ConstitutionalSimulationType = (typeof CONSTITUTIONAL_SIMULATION_TYPES)[number];

export function buildScenarioForecasts(input: {
  dashboard: RecoveryDashboardReadModel;
}) {
  return CONSTITUTIONAL_SIMULATION_TYPES.map((simulationType) => ({
    simulationType,
    survivabilityScore: Math.max(0, Math.min(1, input.dashboard.continuityConfidence - (input.dashboard.continuityRiskScore * 0.35))),
    escalationRisk: Math.max(0, Math.min(1, (input.dashboard.escalationCoordination?.confidence ? 1 - input.dashboard.escalationCoordination.confidence : 0.4) + (input.dashboard.replayDivergenceCount > 0 ? 0.2 : 0))),
    containmentFailureProbability: Math.max(0, Math.min(1, (input.dashboard.continuityConvergence?.requiresContainment ? 0.45 : 0.15) + (input.dashboard.continuityRiskScore * 0.35))),
    governanceIntegrityForecast: Math.max(0, Math.min(1, (input.dashboard.stewardship?.confidence ?? 0.5) - (input.dashboard.governanceDisputes.length > 0 ? 0.25 : 0))),
    unstableDomains: Array.from(new Set([
      ...input.dashboard.degradedSystems,
      ...(input.dashboard.operationalStabilityAssessment?.unstableSubsystems ?? []),
      ...(input.dashboard.continuityConvergence?.affectedSubsystems ?? []),
    ])).sort(),
    projectedInterventions: Array.from(new Set([
      ...(input.dashboard.continuityConvergence?.requiresFreeze ? ["maintain_constitutional_freeze"] : []),
      ...(input.dashboard.continuityConvergence?.requiresEscalation ? ["prepare_governed_escalation"] : []),
      ...(input.dashboard.pendingApprovals.length > 0 ? ["operator_review_required"] : []),
    ])).sort(),
    evidenceReferences: Array.from(new Set([
      ...(input.dashboard.continuityConvergence?.evidence ?? []),
      ...input.dashboard.auditHistory.map((entry) => String(entry.id ?? entry.auditId ?? "")).filter(Boolean),
    ])).slice(0, 8),
  }));
}
