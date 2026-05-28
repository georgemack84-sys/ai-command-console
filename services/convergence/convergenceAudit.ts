import type { ConvergenceAuditRecord, ConvergenceState, DivergenceCategory } from "./convergenceTypes";

export function buildConvergenceAuditRecord({
  state,
  divergenceScore,
  divergenceCategories,
  evidence,
  affectedExecutions,
  affectedSubsystems,
  recommendations,
  freezeReason,
  timestamp,
}: {
  state: ConvergenceState;
  divergenceScore: number;
  divergenceCategories: DivergenceCategory[];
  evidence: string[];
  affectedExecutions: string[];
  affectedSubsystems: string[];
  recommendations: string[];
  freezeReason?: string;
  timestamp: string;
}): ConvergenceAuditRecord {
  return {
    auditId: `convergence_audit_${timestamp}`,
    state,
    divergenceScore,
    divergenceCategories,
    evidence,
    affectedExecutions,
    affectedSubsystems,
    recommendations,
    freezeReason,
    timestamp,
  };
}
