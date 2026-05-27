import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { ENFORCEMENT_HARNESS_ERROR_CODES, type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const RECOVERY_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "recovery-escalation",
    category: "recovery",
    expectedOutcome: "DENIED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.RECOVERY_ESCALATION_ATTEMPT,
    description: "direct jump to NORMAL is denied",
    mutateInput: (input) => ({
      ...input,
      currentMode: "FULL_CONTAINMENT",
      requestedRecoveryMode: "NORMAL",
      governanceReapproved: true,
    }),
    verifyResult: (result) => !result.recovery.allowed,
  },
  {
    scenarioId: "recovery-forged-manifest",
    category: "recovery",
    expectedOutcome: "DENIED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.FORGED_RECOVERY_MANIFEST,
    description: "forged recovery manifest is denied",
    mutateInput: (input) => ({
      ...input,
      currentMode: "FULL_CONTAINMENT",
      requestedRecoveryMode: "RECOVERY_ONLY",
      governanceReapproved: true,
      recoveryManifestHash: "sha256:forged",
      expectedRecoveryManifestHash: "sha256:expected",
    }),
    verifyResult: (result) => !result.recovery.allowed,
  },
  {
    scenarioId: "recovery-trust-rehydration-spoof",
    category: "recovery",
    expectedOutcome: "DENIED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.TRUST_REHYDRATION_SPOOF,
    description: "trust rehydration spoof cannot restore authority",
    mutateInput: (input) => ({
      ...input,
      currentMode: "RECOVERY_ONLY",
      governanceReapproved: false,
    }),
    verifyResult: (result) => !result.rehydration.allowed,
  },
];

export function runRecoveryAttackHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(RECOVERY_SCENARIOS, baseInput);
}
