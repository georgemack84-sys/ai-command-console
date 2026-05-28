import type { FutureAutonomyCategory, FutureAutonomySimulationStatus } from "./futureAutonomyStates";

export type FutureAutonomyLineageEntry = Readonly<{
  entryId: string;
  simulationId: string;
  coordinationId: string;
  status: FutureAutonomySimulationStatus;
  categories: readonly FutureAutonomyCategory[];
  createdAt: string;
  deterministicHash: string;
}>;

export type FutureAutonomyLineage = Readonly<{
  lineageId: string;
  entries: readonly FutureAutonomyLineageEntry[];
  lineageHash: string;
}>;

export type FutureAutonomyLineageGraph = Readonly<{
  graphId: string;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  recursive: boolean;
  graphHash: string;
}>;

export type FutureAutonomyReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type FutureAutonomyReplayLineage = Readonly<{
  replayLineageId: string;
  replaySourceId: string;
  replaySafe: boolean;
  replayHash: string;
}>;
