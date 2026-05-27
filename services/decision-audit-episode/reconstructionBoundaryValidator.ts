import type { DecisionAuditEpisodeError, DecisionAuditEpisodeInput } from "./types/decisionAuditEpisodeTypes";

export function validateReconstructionBoundary(input: DecisionAuditEpisodeInput): readonly DecisionAuditEpisodeError[] {
  const errors: DecisionAuditEpisodeError[] = [];
  if (input.proposalIntegrityResult.proposal.executionAuthorized || input.recommendationValidationResult.result.executionAuthorized) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_EXECUTION_METADATA",
      message: "Execution metadata is forbidden in reconstructed decision episodes.",
      path: "executionAuthorized",
    });
  }
  if (input.metadata?.runtimeMutation === true || input.metadata?.schedulerHook === true) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_RUNTIME_MUTATION",
      message: "Runtime mutation or scheduler semantics are forbidden in decision episode reconstruction.",
      path: "metadata",
    });
  }
  return Object.freeze(errors);
}
