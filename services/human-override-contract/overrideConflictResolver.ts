import type { OverrideConflict, OverrideContractError, OverrideEvent } from "@/types/human-override-contract";
import { hashOverrideValue } from "./overrideHasher";

export function resolveOverrideConflicts(events: readonly OverrideEvent[]): {
  conflicts: readonly OverrideConflict[];
  errors: readonly OverrideContractError[];
} {
  const conflicts: OverrideConflict[] = [];
  const errors: OverrideContractError[] = [];
  const ordered = [...events].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp) || left.overrideId.localeCompare(right.overrideId),
  );

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous.timestamp === current.timestamp && previous.targetId === current.targetId) {
      const type =
        (previous.overrideType === "freeze" && current.overrideType === "resume")
        || (previous.overrideType === "resume" && current.overrideType === "freeze")
          ? "freeze_resume_conflict"
          : (previous.overrideType === "revoke" && current.overrideType === "escalate")
            || (previous.overrideType === "escalate" && current.overrideType === "revoke")
            ? "revoke_escalate_conflict"
            : "ordering_conflict";
      conflicts.push(
        Object.freeze({
          conflictId: hashOverrideValue("override-conflict-id", {
            previous: previous.overrideId,
            current: current.overrideId,
            type,
          }),
          type,
          overrideIds: Object.freeze([previous.overrideId, current.overrideId]),
          valid: false,
          reason: "Concurrent override ordering conflict detected.",
        }),
      );
      errors.push({
        code: "OVERRIDE_ORDERING_CONFLICT",
        message: "Concurrent override ordering conflict detected.",
        path: "events",
      });
    }
    if (current.parentOverrideId && !ordered.some((event) => event.overrideId === current.parentOverrideId)) {
      conflicts.push(
        Object.freeze({
          conflictId: hashOverrideValue("override-conflict-id", {
            overrideId: current.overrideId,
            parentOverrideId: current.parentOverrideId,
            type: "parent_chain_broken",
          }),
          type: "parent_chain_broken",
          overrideIds: Object.freeze([current.overrideId, current.parentOverrideId]),
          valid: false,
          reason: "Override parent chain is broken.",
        }),
      );
      errors.push({
        code: "OVERRIDE_CHAIN_BROKEN",
        message: "Override parent chain is broken.",
        path: "parentOverrideId",
      });
    }
  }

  return {
    conflicts: Object.freeze(conflicts),
    errors: Object.freeze(errors),
  };
}
