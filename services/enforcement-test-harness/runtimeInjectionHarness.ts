import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { ENFORCEMENT_HARNESS_ERROR_CODES, type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const RUNTIME_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "runtime-injection",
    category: "runtime",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.RUNTIME_INJECTION_DETECTED,
    description: "runtime injection is contained",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      additionalSignals: [
        ...(input.additionalSignals ?? []),
        {
          domain: "execution",
          type: "STATE_UNCERTAIN",
          code: "FAILURE_STATE_UNSAFE_UNKNOWN",
          message: "runtime injection detected",
        },
      ],
    }),
  },
  {
    scenarioId: "runtime-plugin-impersonation",
    category: "runtime",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.PLUGIN_IMPERSONATION_DETECTED,
    description: "plugin impersonation is denied",
    mutateInput: (input) => ({
      ...input,
      trustedSnapshotAdmission: {
        ok: false,
        code: "EXECUTION_BLOCKED_UNTRUSTED_REGISTRY",
        reason: "plugin impersonation detected",
        snapshotId: input.snapshot.manifest.snapshotId,
        registrySnapshotHash: input.snapshot.manifest.registrySnapshotHash,
        blockingCode: "EXECUTION_BLOCKED_UNTRUSTED_REGISTRY",
      },
    }),
  },
  {
    scenarioId: "runtime-dynamic-execution",
    category: "runtime",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.UNAUTHORIZED_DYNAMIC_EXECUTION,
    description: "unauthorized dynamic execution is denied",
    mutateInput: (input) => ({
      ...input,
      runtimeValidation: {
        ...input.runtimeValidation,
        allowed: false,
      },
    }),
  },
];

export function runRuntimeInjectionHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(RUNTIME_SCENARIOS, baseInput);
}
