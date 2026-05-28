export type GovernanceExplanationDecision =
  | "approved"
  | "denied"
  | "escalated"
  | "paused"
  | "requires_review"
  | "unknown";

export type GovernanceReasoningView = Readonly<{
  decisionSource?: string;
  evaluator?: string;
  reason?: string;
  decision: GovernanceExplanationDecision;
  escalationState: "none" | "denied" | "revalidation-required" | "unknown";
  governanceEvidenceHash?: string;
  tracePolicyId?: string;
  confidenceScore?: number;
  unknownReasoning: boolean;
}>;
