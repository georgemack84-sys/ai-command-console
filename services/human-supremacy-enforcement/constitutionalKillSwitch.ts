import type { HumanSupremacyEnforcementInput, KillSwitchRecord } from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function activateKillSwitch(input: HumanSupremacyEnforcementInput): KillSwitchRecord {
  const active = input.interventionType === "kill_switch";
  return Object.freeze({
    killSwitchId: hashSupremacyValue("human-supremacy-kill-switch-id", {
      supremacyId: input.supremacyId,
      interventionType: input.interventionType,
    }),
    active,
    scope: active ? "global" : "none",
    shutdownHash: hashSupremacyValue("human-supremacy-kill-switch", {
      supremacyId: input.supremacyId,
      active,
    }),
  });
}
