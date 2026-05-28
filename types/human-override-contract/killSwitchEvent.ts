export type KillSwitchScope = "subsystem" | "mission" | "global";

export type KillSwitchEvent = Readonly<{
  killSwitchId: string;
  initiatedBy: string;
  authorityLevel: string;
  scope: KillSwitchScope;
  reasonCode: string;
  autonomyStateHash: string;
  governanceSnapshotHash: string;
  activatedAt: string;
}>;
