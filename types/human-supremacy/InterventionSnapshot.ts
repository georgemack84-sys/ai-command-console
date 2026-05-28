import type { HumanSupremacyState } from "./HumanSupremacyState";

export type InterventionSnapshot = Readonly<{
  snapshotId: string;
  coordinationId: string;
  state: HumanSupremacyState;
  operatorId: string;
  overrideActive: boolean;
  freezeActive: boolean;
  governanceVisible: true;
  replaySafe: true;
  createdAt: string;
  snapshotHash: string;
}>;
