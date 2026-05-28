import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { resolveTargetSensitivity } from "./targetSensitivityResolver";

export function evaluateProtectedTargetIsolation(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
}) {
  const sensitivity = resolveTargetSensitivity(input.canonicalIntent);
  const isolated =
    sensitivity.protectedTargetDetected
    && (
      input.registryEntry?.riskClass === "destructive"
      || input.registryEntry?.riskClass === "external_mutation"
      || input.registryEntry?.requiresApprovalDefault === true
      || input.canonicalIntent.governanceRisk !== "safe"
    );

  return {
    protectedTargetDetected: sensitivity.protectedTargetDetected,
    escalationRequired: sensitivity.protectedTargetDetected,
    isolated,
    reasons: sensitivity.reasons,
  };
}
