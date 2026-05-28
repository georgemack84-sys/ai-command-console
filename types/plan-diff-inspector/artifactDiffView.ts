export type PlanArtifactDiffType =
  | "ADDED"
  | "REMOVED"
  | "CHANGED"
  | "TYPE_CHANGED"
  | "REORDERED"
  | "HASH_CHANGED"
  | "REFERENCE_CHANGED";

export type PlanDriftClass =
  | "NO_DRIFT"
  | "NON_SEMANTIC_DRIFT"
  | "SEMANTIC_DRIFT"
  | "GOVERNANCE_DRIFT"
  | "REPLAY_DRIFT"
  | "REGISTRY_DRIFT"
  | "EVIDENCE_DRIFT"
  | "UNKNOWN_DRIFT";

export type ArtifactDiffEntry = Readonly<{
  path: string;
  diffType: PlanArtifactDiffType;
  baseType: string;
  targetType: string;
  baseValueHash?: string;
  targetValueHash?: string;
}>;

export type ArtifactDiffView = Readonly<{
  baseArtifactHash: string;
  targetArtifactHash: string;
  changedPaths: readonly string[];
  diffs: readonly ArtifactDiffEntry[];
  visibleDiffCount: number;
  driftClass: PlanDriftClass;
}>;
