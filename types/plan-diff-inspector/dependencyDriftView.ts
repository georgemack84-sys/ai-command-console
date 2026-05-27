import type { PlanDriftClass } from "./artifactDiffView";

export type DependencyDriftView = Readonly<{
  driftClass: PlanDriftClass;
  addedEdges: readonly string[];
  removedEdges: readonly string[];
  reorderedDependencies: boolean;
  cycleDetected: boolean;
  duplicateEdges: boolean;
  visibleEdgeCount: number;
}>;
