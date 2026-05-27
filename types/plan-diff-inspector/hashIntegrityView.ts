export type HashComparisonView = Readonly<{
  path: string;
  baseHash?: string;
  targetHash?: string;
  changed: boolean;
  validBaseHash: boolean;
  validTargetHash: boolean;
}>;

export type HashIntegrityView = Readonly<{
  baseArtifactHash: string;
  targetArtifactHash: string;
  declaredHashes: readonly HashComparisonView[];
  changedHashPaths: readonly string[];
  invalidHashPaths: readonly string[];
  hashMismatch: boolean;
}>;
