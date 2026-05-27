export type DependencyNode = Readonly<{
  nodeId: string;
  label: string;
  kind: "validation" | "validator" | "evidence";
  status: "ok" | "missing" | "invalid";
}>;

export type DependencyEdge = Readonly<{
  edgeId: string;
  from: string;
  to: string;
  status: "ok" | "duplicate" | "cycle";
}>;

export type DependencyProjection = Readonly<{
  nodes: readonly DependencyNode[];
  edges: readonly DependencyEdge[];
  hasCycle: boolean;
  hasDuplicateEdges: boolean;
  visibleNodeCount: number;
  visibleEdgeCount: number;
  projectionHash: string;
}>;
