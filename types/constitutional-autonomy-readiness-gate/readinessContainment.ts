export type ReadinessContainment = Readonly<{
  containmentId: string;
  runtimeBoundarySafe: boolean;
  hiddenExecutionDetected: boolean;
  boundedCoordination: boolean;
  overrideSupremacyPreserved: boolean;
  nonExecutingArchitecture: boolean;
  reasons: readonly string[];
  createdAt: string;
}>;
