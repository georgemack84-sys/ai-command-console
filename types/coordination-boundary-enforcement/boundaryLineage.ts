import type { CoordinationBoundaryState, CoordinationBoundaryVerdict } from "./boundaryStates";

export type BoundaryLineageEntry = Readonly<{
  entryId: string;
  boundaryId: string;
  coordinationId: string;
  verdict: CoordinationBoundaryVerdict;
  boundaryState: CoordinationBoundaryState;
  createdAt: string;
  deterministicHash: string;
}>;

export type BoundaryLineage = Readonly<{
  lineageId: string;
  entries: readonly BoundaryLineageEntry[];
  lineageHash: string;
}>;
