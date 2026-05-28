import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildMissionConsoleSeedContext,
  buildMissionConsoleView,
  detectMissionConsoleMutationViolations,
} from "@/services/mission-intelligence-console";

export function buildMissionConsoleFixture(overrides: Partial<{
  executionId: string;
}> = {}) {
  const input = buildMissionConsoleSeedContext({
    executionId: overrides.executionId,
  });
  return {
    input,
    view: buildMissionConsoleView(input),
  };
}

export function loadMissionConsoleSources() {
  const serviceRoot = path.resolve("services", "mission-intelligence-console");
  const componentRoot = path.resolve("components", "mission", "console");
  return [
    "index.ts",
    "missionConsoleHasher.ts",
    "missionConsoleGuards.ts",
    "missionConsoleSeed.ts",
    "missionConsoleBuilder.ts",
  ].map((file) => ({
    path: path.join(serviceRoot, file),
    content: readFileSync(path.join(serviceRoot, file), "utf8"),
  })).concat([
    "MissionIntelligenceConsole.tsx",
    "MissionConsoleShell.tsx",
    "MissionConsoleNav.tsx",
    "MissionStatusHeader.tsx",
    "TimelinePanel.tsx",
    "ReplayPanel.tsx",
    "DriftPanel.tsx",
    "GovernancePanel.tsx",
    "SnapshotPanel.tsx",
    "DependencyPanel.tsx",
    "SimulationPanel.tsx",
    "RecoveryPanel.tsx",
    "ApprovalPanel.tsx",
    "AutonomyReadinessPanel.tsx",
  ].map((file) => ({
    path: path.join(componentRoot, file),
    content: readFileSync(path.join(componentRoot, file), "utf8"),
  })));
}

export {
  buildMissionConsoleView,
  detectMissionConsoleMutationViolations,
};
