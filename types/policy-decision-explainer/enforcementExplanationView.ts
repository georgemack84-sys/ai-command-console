export type EnforcementChainStep = Readonly<{
  step: string;
  status: string;
  reason: string;
  evidenceHash?: string;
}>;

export type EnforcementExplanationView = Readonly<{
  enforcementChain: readonly EnforcementChainStep[];
  enforcementOrder: readonly string[];
  blockingPoint?: string;
  finalDecisionSource: string;
  failClosedReason?: string;
}>;
