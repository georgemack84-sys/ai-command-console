import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { ENFORCEMENT_HARNESS_ERROR_CODES, type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const IDENTITY_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "identity-duplicate-id",
    category: "identity",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.TOOL_IDENTITY_SPOOF_DETECTED,
    description: "duplicate identity triggers untrusted snapshot containment",
    mutateInput: (input) => ({
      ...input,
      trustedSnapshotAdmission: {
        ok: false,
        code: "EXECUTION_BLOCKED_UNTRUSTED_REGISTRY",
        reason: "duplicate tool identity detected",
        snapshotId: input.snapshot.manifest.snapshotId,
        registrySnapshotHash: input.snapshot.manifest.registrySnapshotHash,
        blockingCode: "EXECUTION_BLOCKED_UNTRUSTED_REGISTRY",
      },
    }),
  },
  {
    scenarioId: "identity-alias-collision",
    category: "identity",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.TOOL_ALIAS_COLLISION,
    description: "alias collision is denied through zone admission",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: {
        ...input.zoneAdmission,
        allowed: false,
      },
    }),
  },
  {
    scenarioId: "identity-version-drift",
    category: "identity",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.TOOL_VERSION_DRIFT,
    description: "version drift trips runtime drift containment",
    mutateInput: (input) => ({
      ...input,
      runtimeValidation: {
        ...input.runtimeValidation,
        allowed: false,
        drift: {
          ...input.runtimeValidation.drift,
          driftDetected: true,
        },
      },
    }),
  },
];

export function runIdentityAttackHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(IDENTITY_SCENARIOS, baseInput);
}
