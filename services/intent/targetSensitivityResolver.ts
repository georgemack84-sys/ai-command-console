import { PROTECTED_PARAMETER_KEYS, PROTECTED_TARGET_PATTERNS } from "@/services/governance/semanticGovernancePolicies";
import type { CanonicalIntent } from "@/types/semanticResolution";

export function resolveTargetSensitivity(canonicalIntent: CanonicalIntent) {
  const target = canonicalIntent.target.toLowerCase();
  const protectedTargetDetected = PROTECTED_TARGET_PATTERNS.some((pattern) => pattern.test(target))
    || PROTECTED_PARAMETER_KEYS.some((key) => key in canonicalIntent.parameters);

  return {
    protectedTargetDetected,
    sensitivity: protectedTargetDetected ? "protected" as const : "standard" as const,
    reasons: protectedTargetDetected ? ["PROTECTED_TARGET_ESCALATION_REQUIRED"] : [],
  };
}
