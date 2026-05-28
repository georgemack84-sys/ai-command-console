import type { DecisionAuditEpisodeError } from "./types/decisionAuditEpisodeTypes";

export function shouldDecisionEpisodeFailClosed(errors: readonly DecisionAuditEpisodeError[]): boolean {
  return errors.length > 0;
}
