import type { AttackScenarioCategory } from "./attackStates";

export type AdversarialScenarioRecord = Readonly<{
  scenarioId: string;
  category: AttackScenarioCategory;
  version: "v1";
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  approvalLineageId: string;
  dependencyLineageId: string;
  deterministicSeed: string;
  markers: readonly string[];
  scenarioHash: string;
}>;

export type AttackVector = Readonly<{
  vectorId: string;
  scenarioId: string;
  category: AttackScenarioCategory;
  deterministicSeed: string;
  vectorMarkers: readonly string[];
  vectorHash: string;
}>;
