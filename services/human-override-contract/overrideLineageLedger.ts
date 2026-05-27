import type {
  FreezeState,
  KillSwitchEvent,
  OverrideEvent,
  OverrideLineageEntry,
  OverrideLineageLedger,
} from "@/types/human-override-contract";
import { hashOverrideValue } from "./overrideHasher";

export function appendOverrideLineage(input: {
  existing?: OverrideLineageLedger;
  event: OverrideEvent;
  freezeState: FreezeState;
  killSwitch?: KillSwitchEvent;
  replayHash: string;
  lineageHash: string;
}): OverrideLineageLedger {
  const entry: OverrideLineageEntry = Object.freeze({
    entryId: hashOverrideValue("override-lineage-entry-id", {
      overrideId: input.event.overrideId,
      lineageHash: input.lineageHash,
    }),
    override: input.event,
    freezeStateHash: hashOverrideValue("override-freeze-state", input.freezeState),
    killSwitchHash: input.killSwitch ? hashOverrideValue("override-kill-switch", input.killSwitch) : undefined,
    replayHash: input.replayHash,
    lineageHash: input.lineageHash,
  });

  return Object.freeze({
    lineageId: input.existing?.lineageId ?? hashOverrideValue("override-lineage-id", {
      targetId: input.event.targetId,
      firstOverrideId: input.event.overrideId,
    }),
    entries: Object.freeze([...(input.existing?.entries ?? []), entry]),
    freezeState: input.freezeState,
    killSwitch: input.killSwitch,
    immutable: true,
  });
}
