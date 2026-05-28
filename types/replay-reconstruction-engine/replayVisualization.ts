export type ReplayVisualization = Readonly<{
  replayTimelineId: string;
  eventIds: readonly string[];
  dependencyEdges: readonly string[];
  causalityChain: readonly string[];
  policyReplayWarnings: readonly string[];
  visibleEvidenceRefs: readonly string[];
  visualizationHash: string;
}>;
