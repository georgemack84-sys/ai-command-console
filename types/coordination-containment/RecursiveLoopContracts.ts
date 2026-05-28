export type RecursiveLoopSignal = Readonly<{
  path: readonly string[];
  recursive: boolean;
  depthExceeded: boolean;
  evidence: readonly string[];
}>;
