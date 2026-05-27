import type {
  AutonomyFreezeRecord,
  HumanSupremacyEnforcementInput,
  HumanSupremacyError,
} from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function activateAutonomyFreeze(input: HumanSupremacyEnforcementInput): {
  freeze: AutonomyFreezeRecord;
  errors: readonly HumanSupremacyError[];
} {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  const active = input.interventionType === "freeze" || input.interventionType === "kill_switch";
  const propagationFailed = normalized.includes("freezepropagationfailure") || normalized.includes("delayedfreezepropagation");
  const errors: HumanSupremacyError[] = [];
  if (active && propagationFailed) {
    errors.push(Object.freeze({
      code: "HUMAN_SUPREMACY_FREEZE_PROPAGATION_FAILED",
      message: "Freeze propagation failed or was delayed.",
      path: "metadata",
    }));
  }
  return Object.freeze({
    freeze: Object.freeze({
      freezeId: hashSupremacyValue("human-supremacy-freeze-id", {
        supremacyId: input.supremacyId,
        interventionType: input.interventionType,
      }),
      active,
      scope: !active ? "none" : input.interventionType === "kill_switch" ? "global" : "autonomy",
      freezeHash: hashSupremacyValue("human-supremacy-freeze", {
        supremacyId: input.supremacyId,
        active,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
