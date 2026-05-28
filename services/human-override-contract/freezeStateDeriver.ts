import type { FreezeState, OverrideEvent } from "@/types/human-override-contract";
import { hashOverrideValue } from "./overrideHasher";

function freezeTypeForEvent(event: OverrideEvent): FreezeState["freezeType"] {
  if (event.overrideType === "kill_switch") {
    return event.targetType === "global" ? "global" : "constitutional";
  }
  if (event.overrideType === "freeze") {
    return event.targetType === "global" ? "global" : "hard";
  }
  if (event.overrideType === "pause") {
    return "soft";
  }
  return "soft";
}

export function deriveFreezeState(events: readonly OverrideEvent[], governanceHash: string): FreezeState {
  const ordered = [...events].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp) || left.overrideId.localeCompare(right.overrideId),
  );
  let latestFreeze: OverrideEvent | undefined;
  let latestResume: OverrideEvent | undefined;

  for (const event of ordered) {
    if (event.overrideType === "pause" || event.overrideType === "freeze" || event.overrideType === "kill_switch") {
      latestFreeze = event;
    }
    if (event.overrideType === "resume") {
      latestResume = event;
    }
  }

  const active = Boolean(
    latestFreeze
    && (!latestResume || latestResume.timestamp < latestFreeze.timestamp),
  );

  return Object.freeze({
    freezeId: hashOverrideValue("freeze-state-id", {
      latestFreezeId: latestFreeze?.overrideId ?? "none",
      latestResumeId: latestResume?.overrideId ?? "none",
      governanceHash,
    }),
    freezeType: latestFreeze ? freezeTypeForEvent(latestFreeze) : "soft",
    initiatedBy: latestFreeze?.operatorId ?? "none",
    active,
    affectedScopes: Object.freeze(
      latestFreeze ? [`${latestFreeze.targetType}:${latestFreeze.targetId}`] : [],
    ),
    createdAt: latestFreeze?.createdAt ?? "1970-01-01T00:00:00.000Z",
    releasedAt: !active ? latestResume?.createdAt : undefined,
    governanceHash,
  });
}
