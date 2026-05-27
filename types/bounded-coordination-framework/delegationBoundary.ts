export type DelegationBoundary = Readonly<{
  nodeId: string;
  allowed: boolean;
  withinDepth: boolean;
  withinBranchFactor: boolean;
  withinDelegationLimit: boolean;
  withinEscalationDepth: boolean;
  reasons: readonly string[];
}>;
