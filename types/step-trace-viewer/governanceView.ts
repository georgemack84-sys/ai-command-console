export type GovernanceOverlay = Readonly<{
  policyId?: string;
  decision: "passed" | "failed" | "denied" | "revalidation-required";
  evaluator: string;
  reason: string;
  confidenceScore?: number;
  evidenceHash: string;
  escalationState: "none" | "denied" | "revalidation-required";
}>;
