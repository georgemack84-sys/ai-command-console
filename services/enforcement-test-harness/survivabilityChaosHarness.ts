import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const SURVIVABILITY_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "survivability-contained-observable",
    category: "survivability",
    expectedOutcome: "CONTAINED",
    description: "survivability remains observable without granting execution",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      freezeBypassAttempted: true,
    }),
    verifyResult: (result) =>
      result.survivability.telemetryOperational &&
      result.survivability.auditOperational &&
      result.survivability.recoveryOperational &&
      result.survivability.operatorVisibilityOperational &&
      !result.allowed,
  },
];

export function runSurvivabilityChaosHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(SURVIVABILITY_SCENARIOS, baseInput);
}
