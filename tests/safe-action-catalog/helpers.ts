import { readFileSync } from "node:fs";
import path from "node:path";

import { buildAutonomyReadinessFixture } from "@/tests/autonomy-readiness/helpers";
import { deriveSafeActionProfile } from "@/services/safe-action-catalog";
import type { AutonomyLevel, AutonomyReadinessProfile, AutonomyState } from "@/types/autonomy-readiness";

export function buildSafeActionFixture(overrides: Partial<{
  actionId: string;
  autonomyLevel: AutonomyLevel;
}> = {}) {
  const readinessFixture = buildAutonomyReadinessFixture({
    executionId: overrides.autonomyLevel ? `exec-${overrides.autonomyLevel.toLowerCase()}` : undefined,
  });
  const level: AutonomyLevel = overrides.autonomyLevel ?? "A1";
  const derivedState: AutonomyState =
    level === "A0"
      ? "observe_only"
      : level === "A1"
        ? "recommendation_only"
        : level === "A2"
          ? "planning_only"
          : level === "A6"
            ? "forbidden"
            : "simulation_only";

  const profile: AutonomyReadinessProfile = Object.freeze({
    ...readinessFixture.profile,
      autonomyLevel: level,
      derivedState,
    authorityCeiling: Object.freeze({
      ...readinessFixture.profile.authorityCeiling,
      currentLevel: level,
      ceilingLevel: level === "A6" ? "A2" : level,
      permittedStates: Object.freeze([derivedState] as const),
    }),
    governanceBinding: Object.freeze({
      ...readinessFixture.profile.governanceBinding,
      sourceState: "ALLOW" as const,
      disputed: false,
    }),
    replayBinding: Object.freeze({
      ...readinessFixture.profile.replayBinding,
      deterministic: true,
      disputed: false,
    }),
    capabilityDriftDetected: false,
    disputes: Object.freeze([]),
    warnings: Object.freeze([]),
    errors: Object.freeze([]),
  });

  return {
    readinessProfile: profile,
    safeActionProfile: deriveSafeActionProfile({
      readinessProfile: profile,
      actionId: overrides.actionId ?? "safe-action:observe",
    }),
  };
}

export function loadSafeActionCatalogSources() {
  const files = [
    ["services", "safe-action-catalog", "index.ts"],
    ["services", "safe-action-catalog", "safeActionRegistry.ts"],
    ["services", "safe-action-catalog", "safeActionSchemas.ts"],
    ["services", "safe-action-catalog", "safeActionRiskClassifier.ts"],
    ["services", "safe-action-catalog", "safeActionScopeValidator.ts"],
    ["services", "safe-action-catalog", "safeActionGovernanceBinder.ts"],
    ["services", "safe-action-catalog", "safeActionReplayBinder.ts"],
    ["services", "safe-action-catalog", "safeActionDeriver.ts"],
    ["services", "safe-action-catalog", "safeActionHasher.ts"],
    ["services", "safe-action-catalog", "safeActionGuards.ts"],
  ];

  return files.map((segments) => {
    const filePath = path.resolve(...segments);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
