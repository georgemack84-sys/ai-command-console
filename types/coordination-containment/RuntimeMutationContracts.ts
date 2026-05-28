export type RuntimeMutationSignal = Readonly<{
  detected: boolean;
  evidence: readonly string[];
}>;
