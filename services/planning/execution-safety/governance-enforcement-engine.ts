import type { ExecutionTruthPackage } from "../execution-truth";
import { resolvePolicyLocks } from "./execution-policy-registry";
import type { ContainmentZone, GovernanceSafetyContract } from "./execution-safety-types";

function resolveContainmentZone(executionTruthPackage: ExecutionTruthPackage): ContainmentZone {
  const signals = executionTruthPackage.riskProfile.stepSignals;
  if (signals.some((signal) => signal.targetEnvironment === "production")) {
    return "PRODUCTION_RESTRICTED";
  }
  if (signals.some((signal) => signal.externalSideEffect)) {
    return "NON_PRODUCTION";
  }
  return "READ_ONLY";
}

export function enforceGovernanceSafety(executionTruthPackage: ExecutionTruthPackage): GovernanceSafetyContract {
  const containmentZone = resolveContainmentZone(executionTruthPackage);
  const blockedReasons = [...executionTruthPackage.governanceEnvelope.blockedReasons];

  if (!executionTruthPackage.executionTruthHash) {
    blockedReasons.push("Execution truth hash missing.");
  }

  return {
    allowed: executionTruthPackage.governanceEnvelope.allowed && blockedReasons.length === 0,
    requiredApprovals: [...executionTruthPackage.governanceEnvelope.requiredApprovals],
    blockedReasons,
    escalationRequired: executionTruthPackage.governanceEnvelope.escalationRequired,
    policyLocks: resolvePolicyLocks(),
    containmentZone,
  };
}
