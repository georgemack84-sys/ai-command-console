import type { GovernanceDriftCategory, GovernanceDriftState } from "./governanceDriftStates";

export type GovernanceDriftLineageEntry = Readonly<{
  entryId: string;
  driftId: string;
  coordinationId: string;
  driftState: GovernanceDriftState;
  categories: readonly GovernanceDriftCategory[];
  createdAt: string;
  deterministicHash: string;
}>;

export type GovernanceDriftLineage = Readonly<{
  lineageId: string;
  entries: readonly GovernanceDriftLineageEntry[];
  lineageHash: string;
}>;

export type GovernanceDriftLineageGraph = Readonly<{
  graphId: string;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  recursive: boolean;
  graphHash: string;
}>;

export type GovernanceDriftReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;
