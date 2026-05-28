export type OrchestrationDelegationAnalysis = Readonly<{
  recursive: boolean;
  depth: number;
  delegationCount: number;
  evidence: readonly string[];
}>;
