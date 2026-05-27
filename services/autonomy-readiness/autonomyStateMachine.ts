import type { AutonomyDispute, AutonomyLevel, AutonomyState } from "@/types/autonomy-readiness";
import { getAutonomyReadinessDefinition } from "./autonomyReadinessRegistry";

export function deriveAutonomyState(input: {
  level: AutonomyLevel;
  governanceDenied: boolean;
  governanceDisputed: boolean;
  replayDisputed: boolean;
  snapshotLineageMissing: boolean;
  overCeiling: boolean;
  disputes: readonly AutonomyDispute[];
}): AutonomyState {
  if (input.level === "A6") {
    return "forbidden";
  }
  if (input.governanceDenied || input.overCeiling || input.snapshotLineageMissing) {
    return "forbidden";
  }
  if (input.governanceDisputed || input.replayDisputed || input.disputes.length > 0) {
    return "disputed";
  }

  return getAutonomyReadinessDefinition(input.level)?.derivedState ?? "forbidden";
}
