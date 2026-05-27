import type { AttackSimulationState } from "./attackStates";

export type AttackLineageEntry = Readonly<{
  entryId: string;
  attackId: string;
  scenarioId: string;
  coordinationId: string;
  attackState: AttackSimulationState;
  createdAt: string;
  deterministicHash: string;
}>;

export type AttackLineage = Readonly<{
  lineageId: string;
  entries: readonly AttackLineageEntry[];
  lineageHash: string;
}>;
