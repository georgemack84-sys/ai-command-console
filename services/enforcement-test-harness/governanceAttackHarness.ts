import type { FailureOrchestrationInput } from "@/services/failure-orchestration";
import { runEnforcementScenarios } from "./enforcementTestHarness";
import { ENFORCEMENT_HARNESS_ERROR_CODES, type EnforcementScenarioDefinition } from "./enforcementHarnessTypes";

const GOVERNANCE_SCENARIOS: readonly EnforcementScenarioDefinition[] = [
  {
    scenarioId: "governance-bypass",
    category: "governance",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.GOVERNANCE_BYPASS_ATTEMPT,
    description: "governance bypass attempt forces containment",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      additionalSignals: [
        ...(input.additionalSignals ?? []),
        {
          domain: "governance",
          type: "GOVERNANCE_MISMATCH",
          code: "FAILURE_GOVERNANCE_MISMATCH",
          message: "governance bypass attempt",
        },
      ],
    }),
  },
  {
    scenarioId: "governance-policy-mutation",
    category: "governance",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.POLICY_MUTATION_DETECTED,
    description: "policy mutation is denied",
    mutateInput: (input) => ({
      ...input,
      runtimeValidation: {
        ...input.runtimeValidation,
        failures: [
          ...input.runtimeValidation.failures,
          {
            code: "RUNTIME_GOVERNANCE_DRIFT",
            message: "policy mutation detected",
            path: "activeRuntime.policy",
          },
        ],
      },
    }),
  },
  {
    scenarioId: "governance-audit-suppression",
    category: "governance",
    expectedOutcome: "CONTAINED",
    errorCode: ENFORCEMENT_HARNESS_ERROR_CODES.AUDIT_SUPPRESSION_ATTEMPT,
    description: "audit suppression attempt is contained while audit survivability remains on",
    mutateInput: (input) => ({
      ...input,
      zoneAdmission: { ...input.zoneAdmission, allowed: false },
      additionalSignals: [
        ...(input.additionalSignals ?? []),
        {
          domain: "audit",
          type: "UNKNOWN_FAILURE",
          code: "FAILURE_BYPASS_ATTEMPT",
          message: "audit suppression attempt",
        },
      ],
    }),
    verifyResult: (result) => result.survivability.auditOperational,
  },
];

export function runGovernanceAttackHarness(
  baseInput: FailureOrchestrationInput,
) {
  return runEnforcementScenarios(GOVERNANCE_SCENARIOS, baseInput);
}
