import type { BoundaryViolationType, OrchestrationDriftType } from "./boundaryStates";

export type BoundaryViolation = Readonly<{
  violationId: string;
  coordinationId: string;
  violationType: BoundaryViolationType;
  driftType?: OrchestrationDriftType;
  severity: "elevated" | "high" | "critical";
  governanceLinked: boolean;
  replaySafe: boolean;
  createdAt: string;
  deterministicHash: string;
}>;
