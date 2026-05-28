import type { OverrideContractError, OverrideEvent } from "@/types/human-override-contract";

export function validateOverrideEventSchema(event: OverrideEvent): readonly OverrideContractError[] {
  const errors: OverrideContractError[] = [];
  if (
    !event.overrideId
    || !event.timestamp
    || !event.operatorId
    || !event.operatorRole
    || !event.targetId
    || !event.reasonCode
    || !event.justification
    || !event.authoritySnapshotHash
    || !event.governanceSnapshotHash
    || !event.approvalGraphHash
    || !event.createdAt
  ) {
    errors.push({
      code: "OVERRIDE_SCOPE_INVALID",
      message: "Override event schema is incomplete.",
      path: "overrideEvent",
    });
  }
  return Object.freeze(errors);
}
