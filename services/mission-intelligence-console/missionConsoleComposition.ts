import type { MissionConsoleBuildInput, MissionConsoleView } from "@/types/mission-intelligence-console";
import type { AutonomyLevel } from "@/types/deterministic-snapshot-engine";
import { buildMissionConsoleSeedContext } from "./missionConsoleSeed";
import { buildMissionConsoleView } from "./missionConsoleBuilder";

export type ConsoleCompositionContext = Readonly<{
  missionSeedContext: MissionConsoleBuildInput;
  missionView: MissionConsoleView;
}>;

export function buildMissionConsoleComposition(input?: Readonly<{
  missionId?: string;
  executionId?: string;
  autonomyLevel?: AutonomyLevel;
}>): ConsoleCompositionContext {
  const missionSeedContext = buildMissionConsoleSeedContext(input);
  const missionView = buildMissionConsoleView(missionSeedContext);

  return Object.freeze({
    missionSeedContext,
    missionView,
  });
}
