import type { LearningObjectiveProfile, StrategyCurriculumProposal, StrategySelectionRecord } from "../../types/learning-constitution/strategySelectionEngine";
/** Converts a Phase 40 recommendation into a reviewable Phase 27 handoff without bypassing Phase 26 approval or a Phase 28 lease. */
export class StrategyCurriculumProposalService {
  propose(input: Readonly<{ proposalId: string; selection: StrategySelectionRecord; objective: LearningObjectiveProfile; goal: string; createdAt: string }>): StrategyCurriculumProposal {
    if (input.selection.status !== "RECOMMENDED" || !input.selection.selectedStrategyId) throw new Error("A recommended strategy selection is required before curriculum proposal.");
    if (input.selection.objectiveProfileId !== input.objective.profileId || input.selection.requestId.trim().length === 0) throw new Error("Selection and objective profile lineage mismatch.");
    if (!input.goal.trim()) throw new Error("A curriculum goal is required.");
    const dimensions: StrategyCurriculumProposal["requiredEvaluationDimensions"] = ["IMMEDIATE", ...(input.objective.transferRequirement === "HIGH" ? ["TRANSFER" as const] : []), ...(input.objective.retentionRequirement === "HIGH" ? ["RETENTION" as const] : []), ...(input.objective.risk === "HIGH" || input.objective.risk === "SECURITY_CRITICAL" ? ["CALIBRATION" as const] : [])];
    return { proposalId: input.proposalId, selectionId: input.selection.selectionId, objectiveProfileId: input.objective.profileId, objectiveId: input.objective.objectiveId, goal: input.goal, strategyIds: [input.selection.selectedStrategyId], requiredEvaluationDimensions: dimensions, status: "AWAITING_HUMAN_APPROVAL", createdAt: input.createdAt, immutable: true, executionAuthorized: false, requiresExecutionLease: true, authorityEffect: "UNCHANGED" };
  }
}
