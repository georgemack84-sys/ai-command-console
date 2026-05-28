import type { DecisionAuditEpisodeError, DecisionAuditEpisodeInput } from "./types/decisionAuditEpisodeTypes";

export function detectEpisodeAntiEmergenceRisks(input: DecisionAuditEpisodeInput): readonly DecisionAuditEpisodeError[] {
  const errors: DecisionAuditEpisodeError[] = [];
  if (input.hiddenExecutionDetectionResult.report.blocked) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_HIDDEN_EXECUTION",
      message: "Hidden execution findings block decision episode trust.",
      path: "hiddenExecutionDetectionResult.report",
    });
  }
  if (input.metadata?.recursiveReplay === true || input.metadata?.replayEscalationLoop === true) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_RECURSIVE_REPLAY",
      message: "Recursive replay chains are forbidden in decision audit episodes.",
      path: "metadata",
    });
  }
  if (input.metadata?.syntheticReplay === true || input.metadata?.adaptiveReplayMutation === true) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_SYNTHETIC_REPLAY",
      message: "Synthetic or adaptive replay mutation detected.",
      path: "metadata",
    });
  }
  return Object.freeze(errors);
}
