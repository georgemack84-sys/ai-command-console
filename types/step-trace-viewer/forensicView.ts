export type ForensicProjection = Readonly<{
  rootFailure?: string;
  failingValidator?: string;
  failureCategory?: string;
  causalityChain: readonly string[];
  status: string;
  explanationHash: string;
}>;
