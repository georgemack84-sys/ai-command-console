import type { FailureOrchestrationInput, FailureOrchestrationResult } from "@/services/failure-orchestration";
import {
  buildForensicTimeline,
  certifyEnforcementTrust,
  runFreezeBypassHarness,
  runGovernanceAttackHarness,
  runIdentityAttackHarness,
  runRecoveryAttackHarness,
  runReplayCorruptionHarness,
  runRuntimeInjectionHarness,
  runSurvivabilityChaosHarness,
  runEnforcementScenario,
  verifyFailureSnapshotIntegrity,
  type EnforcementScenarioDefinition,
} from "@/services/enforcement-test-harness";
import { buildFailureOrchestrationFixture, evaluateFailureFixture } from "@/tests/failure-orchestration/helpers";

export function buildEnforcementHarnessFixture(
  overrides: Partial<FailureOrchestrationInput> = {},
): FailureOrchestrationInput {
  return buildFailureOrchestrationFixture(overrides);
}

export function evaluateEnforcementFixture(
  overrides: Partial<FailureOrchestrationInput> = {},
): FailureOrchestrationResult {
  return evaluateFailureFixture(overrides);
}

export function runAllAttackHarnesses(
  baseInput: FailureOrchestrationInput = buildEnforcementHarnessFixture(),
) {
  return [
    ...runIdentityAttackHarness(baseInput),
    ...runGovernanceAttackHarness(baseInput),
    ...runReplayCorruptionHarness(baseInput),
    ...runRuntimeInjectionHarness(baseInput),
    ...runFreezeBypassHarness(baseInput),
    ...runRecoveryAttackHarness(baseInput),
    ...runSurvivabilityChaosHarness(baseInput),
  ];
}

export function certifyAllHarnesses(
  baseInput: FailureOrchestrationInput = buildEnforcementHarnessFixture(),
) {
  return certifyEnforcementTrust({
    results: runAllAttackHarnesses(baseInput),
  });
}

export function runCustomHarnessScenario(
  scenario: EnforcementScenarioDefinition,
  baseInput: FailureOrchestrationInput = buildEnforcementHarnessFixture(),
) {
  return runEnforcementScenario(scenario, baseInput);
}

export {
  buildForensicTimeline,
  verifyFailureSnapshotIntegrity,
};
