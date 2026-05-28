import type { RecommendationReplayInput, RecommendationReplayEpisode } from "./types/recommendationReplayTypes";

export function reconstructGovernanceReplay(
  input: RecommendationReplayInput,
): RecommendationReplayEpisode["governanceReplay"] {
  const scope = input.recommendationConstraintResult.scopeRecords.find((item) => item.recommendationId === input.recommendationId);
  const containment = input.recommendationConstraintResult.containmentRecords.find((item) => item.recommendationId === input.recommendationId);
  const priorityInput = input.recommendationPrioritizationInput.inputs.find((item) => item.recommendationId === input.recommendationId);

  return Object.freeze({
    governanceSnapshotId: priorityInput?.governanceSnapshotId ?? input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId,
    policySnapshotId: input.recommendationSynthesisInput.policySnapshotIds[0] ?? "",
    containmentState: containment
      ? `${containment.hiddenExecutionBlocked ? "hidden_execution_blocked" : "hidden_execution_open"}:${containment.orchestrationBlocked ? "orchestration_blocked" : "orchestration_open"}:${containment.schedulingBlocked ? "scheduling_blocked" : "scheduling_open"}`
      : "unknown_containment",
    escalationState: scope
      ? `${scope.escalationCeilingRespected ? "escalation_ceiling_respected" : "escalation_ceiling_breached"}:${scope.approvalCeilingRespected ? "approval_ceiling_respected" : "approval_ceiling_breached"}`
      : "unknown_escalation",
  });
}
