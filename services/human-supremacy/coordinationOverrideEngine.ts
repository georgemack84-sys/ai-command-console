import type { CoordinationOverride, HumanSupremacyAction, HumanSupremacyError } from "@/types/human-supremacy";
import { createHumanSupremacyError } from "./authorityBoundaryValidator";
import { hashInterventionValue } from "./interventionHasher";

export function buildCoordinationOverride(input: {
  coordinationId: string;
  overrideType: CoordinationOverride["overrideType"];
  operatorId: string;
  action: HumanSupremacyAction;
  reason: string;
  replayLineageId: string;
  governanceLineageId: string;
  rationaleSnapshotId: string;
  timestamp: string;
}): Readonly<{
  override?: CoordinationOverride;
  errors: readonly HumanSupremacyError[];
}> {
  const errors: HumanSupremacyError[] = [];
  if (!input.operatorId.trim()) {
    errors.push(createHumanSupremacyError(
      "HUMAN_SUPREMACY_AUTONOMOUS_OVERRIDE_FORBIDDEN",
      "Human intervention requires an explicit operator identity.",
      "operatorId",
    ));
  }
  if (input.action === "override_coordination" && input.overrideType === "emergency") {
    errors.push(createHumanSupremacyError(
      "HUMAN_SUPREMACY_INVALID_OVERRIDE_SCOPE",
      "Emergency overrides must route through the emergency freeze system.",
      "overrideType",
    ));
  }
  if (errors.length > 0) {
    return Object.freeze({ errors: Object.freeze(errors) });
  }
  const override: CoordinationOverride = Object.freeze({
    overrideId: hashInterventionValue("coordination-override-id", {
      coordinationId: input.coordinationId,
      operatorId: input.operatorId,
      timestamp: input.timestamp,
      overrideType: input.overrideType,
    }),
    coordinationId: input.coordinationId,
    overrideType: input.overrideType,
    operatorId: input.operatorId,
    reason: input.reason,
    timestamp: input.timestamp,
    replayLineageId: input.replayLineageId,
    governanceLineageId: input.governanceLineageId,
    rationaleSnapshotId: input.rationaleSnapshotId,
  });
  return Object.freeze({ override, errors: Object.freeze([]) });
}
