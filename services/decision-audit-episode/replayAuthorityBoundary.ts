import type { DecisionAuditEpisodeError, DecisionAuditEpisodeInput } from "./types/decisionAuditEpisodeTypes";

export function validateReplayAuthorityBoundary(input: DecisionAuditEpisodeInput): readonly DecisionAuditEpisodeError[] {
  const errors: DecisionAuditEpisodeError[] = [];
  if (!input.operatorAuthorityResult.suppression.continuityInvalidated) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_AUTHORITY_AMBIGUITY",
      message: "Operator suppression continuity must remain intact across episode reconstruction.",
      path: "operatorAuthorityResult.suppression.continuityInvalidated",
    });
  }
  if (input.metadata?.authorityInheritance === true || input.metadata?.authorityRestoration === true) {
    errors.push({
      code: "DECISION_AUDIT_EPISODE_AUTHORITY_AMBIGUITY",
      message: "Authority inheritance or restoration is forbidden in decision episode replay.",
      path: "metadata",
    });
  }
  return Object.freeze(errors);
}
