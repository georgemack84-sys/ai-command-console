import type { AuthorityCeiling, AutonomyLevel, AutonomyReadinessInput, AutonomyState } from "@/types/autonomy-readiness";
import { hashAutonomyReadinessValue } from "./autonomyHasher";

function levelRank(level: AutonomyLevel): number {
  return ["A0", "A1", "A2", "A3", "A4", "A5", "A6"].indexOf(level);
}

export function projectAuthorityCeiling(input: AutonomyReadinessInput, currentLevel: AutonomyLevel): AuthorityCeiling {
  const ceilingLevel = (input.governanceView.autonomyBoundary.ceilingLevel as AutonomyLevel) ?? "A0";
  const overCeiling = levelRank(currentLevel) > levelRank(ceilingLevel);
  const permittedStates: readonly AutonomyState[] = overCeiling
    ? Object.freeze(["restricted", "disputed", "forbidden"])
    : Object.freeze(["observe_only", "recommendation_only", "planning_only", "simulation_only"]);
  const deniedCapabilities = Object.freeze([
    ...input.governanceView.autonomyBoundary.deniedOperations,
    ...(overCeiling ? ["authority-ceiling-exceeded"] : []),
  ]);

  return Object.freeze({
    currentLevel,
    ceilingLevel,
    permittedStates,
    deniedCapabilities,
    immutable: true,
    ceilingHash: hashAutonomyReadinessValue("authority-ceiling", {
      currentLevel,
      ceilingLevel,
      deniedCapabilities,
    }),
  });
}
