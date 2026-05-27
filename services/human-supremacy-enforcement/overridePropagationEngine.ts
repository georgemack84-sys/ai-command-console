import type {
  HumanSupremacyEnforcementInput,
  HumanSupremacyError,
  OverridePropagationRecord,
} from "./supremacyStateTypes";
import { normalizeSupremacyMetadata } from "./supremacySchemas";
import { hashOverrideLineage } from "./overrideLineageHasher";

export function propagateOperatorOverride(input: HumanSupremacyEnforcementInput): {
  overridePropagation: OverridePropagationRecord;
  errors: readonly HumanSupremacyError[];
} {
  const normalized = normalizeSupremacyMetadata(input.metadata);
  const suppressed = normalized.includes("overridesuppression") || normalized.includes("delayedoverridepropagation");
  const partial = normalized.includes("partialoverridepropagation");
  const errors: HumanSupremacyError[] = [];
  if (suppressed || partial) {
    errors.push(Object.freeze({
      code: "HUMAN_SUPREMACY_OVERRIDE_SUPPRESSED",
      message: "Override propagation was suppressed, delayed, or only partially applied.",
      path: "metadata",
    }));
  }
  const propagationState = suppressed ? "suppressed" : partial ? "partial" : "immediate";
  return Object.freeze({
    overridePropagation: Object.freeze({
      overrideId: hashOverrideLineage("override-id", {
        supremacyId: input.supremacyId,
        interventionType: input.interventionType,
        operatorId: input.operatorId,
      }),
      replayId: input.constitutionalReplayResult.record.replayId,
      globallyPropagated: !suppressed && !partial,
      propagationState,
      overrideHash: hashOverrideLineage("override-propagation", {
        supremacyId: input.supremacyId,
        propagationState,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
