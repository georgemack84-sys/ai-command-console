import type { EscalationDecision, EscalationState } from "@/types/escalation";
import type { ProposalFreshnessEvaluation } from "@/services/freshness/proposalFreshnessEngine";

export function coordinateUncertaintyState(input: {
  freshnessEvaluation: ProposalFreshnessEvaluation;
}): Readonly<{
  trigger: EscalationDecision["trigger"];
  escalationState: EscalationState;
}> {
  const freshness = input.freshnessEvaluation.state;
  if (freshness.replayIntegrity === "quarantined") {
    return Object.freeze({ trigger: "replay_uncertainty", escalationState: "fail_closed" });
  }
  if (freshness.governanceCompatibility === "invalid") {
    return Object.freeze({ trigger: "governance_mismatch", escalationState: "frozen" });
  }
  if (freshness.governanceCompatibility === "review_required") {
    return Object.freeze({ trigger: "governance_mismatch", escalationState: "review" });
  }
  if (freshness.freshnessStatus === "stale" || freshness.freshnessStatus === "expired" || freshness.freshnessStatus === "frozen") {
    return Object.freeze({ trigger: "stale_coordination", escalationState: freshness.freshnessStatus === "frozen" ? "frozen" : "restricted" });
  }
  if (freshness.confidenceState === "invalid" || freshness.confidenceState === "unstable") {
    return Object.freeze({ trigger: "confidence_collapse", escalationState: "critical" });
  }
  if (freshness.confidenceState === "degrading") {
    return Object.freeze({ trigger: "confidence_collapse", escalationState: "review" });
  }
  return Object.freeze({ trigger: "unknown_state", escalationState: "normal" });
}
