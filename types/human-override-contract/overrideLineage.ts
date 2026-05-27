import type { FreezeState } from "./freezeState";
import type { KillSwitchEvent } from "./killSwitchEvent";
import type { OverrideEvent } from "./overrideEvent";

export type OverrideLineageEntry = Readonly<{
  entryId: string;
  override: OverrideEvent;
  freezeStateHash: string;
  killSwitchHash?: string;
  replayHash: string;
  lineageHash: string;
}>;

export type OverrideLineageLedger = Readonly<{
  lineageId: string;
  entries: readonly OverrideLineageEntry[];
  freezeState: FreezeState;
  killSwitch?: KillSwitchEvent;
  immutable: true;
}>;
