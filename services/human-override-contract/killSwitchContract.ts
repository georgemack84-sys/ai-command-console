import type { KillSwitchEvent, OverrideEvent } from "@/types/human-override-contract";

export function deriveKillSwitchEvent(input: {
  events: readonly OverrideEvent[];
  autonomyStateHash: string;
  governanceSnapshotHash: string;
}): KillSwitchEvent | undefined {
  const latest = [...input.events]
    .filter((event) => event.overrideType === "kill_switch")
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.overrideId.localeCompare(left.overrideId))[0];

  if (!latest) {
    return undefined;
  }

  return Object.freeze({
    killSwitchId: latest.overrideId,
    initiatedBy: latest.operatorId,
    authorityLevel: latest.operatorRole,
    scope: latest.targetType === "global" ? "global" : latest.targetType === "mission" ? "mission" : "subsystem",
    reasonCode: latest.reasonCode,
    autonomyStateHash: input.autonomyStateHash,
    governanceSnapshotHash: input.governanceSnapshotHash,
    activatedAt: latest.createdAt,
  });
}
