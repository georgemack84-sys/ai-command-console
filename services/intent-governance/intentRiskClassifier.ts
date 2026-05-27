import type { OperationalIntentResolutionResult } from "@/types/operationalIntent";

export function classifyIntentGovernanceRisk(operationalIntent: OperationalIntentResolutionResult) {
  if (operationalIntent.semanticGovernance.freezeActive || operationalIntent.semanticGovernance.replayDriftDetected) {
    return "critical" as const;
  }
  if (operationalIntent.semanticGovernance.protectedTargetDetected || operationalIntent.contextualResolution.unsafeAssumptions.length > 0) {
    return "high" as const;
  }
  if (operationalIntent.clarification.clarificationRequired || !operationalIntent.contextualResolution.contextSufficient) {
    return "medium" as const;
  }
  if (operationalIntent.plannerAdmission.escalationRequired) {
    return "low" as const;
  }
  return "safe" as const;
}
