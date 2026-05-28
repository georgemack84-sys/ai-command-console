import type { HumanSupremacyEnforcementInput, HumanSupremacyError } from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";

export function validateShutdownReplay(input: HumanSupremacyEnforcementInput): readonly HumanSupremacyError[] {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  if (
    input.interventionType === "kill_switch"
    && (normalized.includes("shutdownpropagationfailure") || normalized.includes("delayedshutdownpropagation"))
  ) {
    return Object.freeze([Object.freeze({
      code: "HUMAN_SUPREMACY_SHUTDOWN_PROPAGATION_FAILED",
      message: "Shutdown propagation failed or was delayed.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
