import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { ENFORCEMENT_HARNESS_ERROR_CODES, type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const REPLAY_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "replay-registry-drift",
    category: "replay",
    expectedOutcome: "REPLAY_REJECTED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.REPLAY_REGISTRY_DRIFT,
    description: "registry drift replay is rejected",
    mutateInput: (input) => ({
      ...input,
      replayRequested: true,
      runtimeValidation: {
        ...input.runtimeValidation,
        attestation: {
          ...input.runtimeValidation.attestation,
          valid: false,
        },
      },
    }),
  },
  {
    scenarioId: "replay-policy-mismatch",
    category: "replay",
    expectedOutcome: "REPLAY_REJECTED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.REPLAY_POLICY_MISMATCH,
    description: "policy drift during replay is rejected",
    mutateInput: (input) => ({
      ...input,
      replayRequested: true,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
    }),
  },
  {
    scenarioId: "replay-hash-invalid",
    category: "replay",
    expectedOutcome: "REPLAY_REJECTED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.REPLAY_HASH_INVALID,
    description: "tampered replay recovery evidence is rejected",
    mutateInput: (input) => ({
      ...input,
      replayRequested: true,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      replayRecoveryTampered: true,
      runtimeValidation: {
        ...input.runtimeValidation,
        attestation: {
          ...input.runtimeValidation.attestation,
          valid: false,
        },
      },
    }),
  },
];

export function runReplayCorruptionHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(REPLAY_SCENARIOS, baseInput);
}
