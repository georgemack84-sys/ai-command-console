import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { ENFORCEMENT_HARNESS_ERROR_CODES, type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const FREEZE_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "freeze-direct-bypass",
    category: "freeze",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.FREEZE_BYPASS_ATTEMPT,
    description: "direct freeze override is blocked",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      freezeBypassAttempted: true,
    }),
  },
  {
    scenarioId: "freeze-partial-disablement",
    category: "freeze",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.FREEZE_BYPASS_ATTEMPT,
    description: "partial freeze disablement remains contained",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      containmentEscapeAttempted: true,
    }),
  },
];

export function runFreezeBypassHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(FREEZE_SCENARIOS, baseInput);
}
