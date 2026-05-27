import type { ConstitutionalReplayDriftInspection, ConstitutionalReplayDriftRecord } from "@/types/constitutional-replay";
import { hashConstitutionalReplayValue } from "@/services/constitutional-replay-attack/deterministicReplayHasher";

export function inspectReplayDrift(input: {
  replayAttackId: string;
  drifts: readonly ConstitutionalReplayDriftRecord[];
}): ConstitutionalReplayDriftInspection {
  const highestSeverity = input.drifts.some((item) => item.classification.includes("GOVERNANCE") || item.classification.includes("VALIDATOR"))
    ? "CONSTITUTIONAL_BLOCKER"
    : input.drifts.length > 0 ? "CRITICAL" : "INFO";
  return Object.freeze({
    replayAttackId: input.replayAttackId,
    driftClasses: Object.freeze(input.drifts.map((item) => item.classification)),
    highestSeverity,
    inspectionHash: hashConstitutionalReplayValue("replay-drift-inspection", {
      replayAttackId: input.replayAttackId,
      highestSeverity,
      classes: input.drifts.map((item) => item.classification),
    }),
  });
}
