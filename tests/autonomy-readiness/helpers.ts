import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildConstitutionalGovernanceSeed,
  buildConstitutionalGovernanceView,
} from "@/services/constitutional-governance-layer";
import {
  deriveAutonomyReadinessProfile,
  detectAutonomyReadinessViolations,
} from "@/services/autonomy-readiness";
import type { AutonomyReadinessInput } from "@/types/autonomy-readiness";

export function buildAutonomyReadinessFixture(overrides: Partial<{
  executionId: string;
}> = {}) {
  const source = buildConstitutionalGovernanceSeed({
    executionId: overrides.executionId,
  });
  const governanceView = buildConstitutionalGovernanceView(source);
  const input: AutonomyReadinessInput = Object.freeze({
    missionId: source.missionId,
    executionId: source.executionId,
    generatedAt: source.generatedAt,
    governanceView,
    source,
  });

  return {
    input,
    profile: deriveAutonomyReadinessProfile(input),
  };
}

export function loadAutonomyReadinessSources() {
  const files = [
    ["services", "autonomy-readiness", "index.ts"],
    ["services", "autonomy-readiness", "autonomyReadinessRegistry.ts"],
    ["services", "autonomy-readiness", "autonomyReadinessDeriver.ts"],
    ["services", "autonomy-readiness", "authorityCeilingProjector.ts"],
    ["services", "autonomy-readiness", "autonomyGovernanceBinder.ts"],
    ["services", "autonomy-readiness", "autonomyStateMachine.ts"],
    ["services", "autonomy-readiness", "autonomyDisputeEngine.ts"],
    ["services", "autonomy-readiness", "autonomyReplayBinder.ts"],
    ["services", "autonomy-readiness", "autonomySimulationClassifier.ts"],
    ["services", "autonomy-readiness", "autonomyValidator.ts"],
    ["services", "autonomy-readiness", "autonomyHasher.ts"],
    ["services", "autonomy-readiness", "autonomyGuards.ts"],
  ];

  return files.map((segments) => {
    const filePath = path.resolve(...segments);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}

export {
  deriveAutonomyReadinessProfile,
  detectAutonomyReadinessViolations,
};
