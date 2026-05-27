import type { CanonicalIntent } from "@/types/semanticResolution";
import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";

export function evaluateIntentRisk(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
}) {
  if (input.canonicalIntent.governanceRisk === "blocked") {
    return "blocked" as const;
  }
  if (input.registryEntry?.riskClass === "destructive" || input.registryEntry?.riskClass === "external_mutation") {
    return "blocked" as const;
  }
  if (input.canonicalIntent.governanceRisk === "restricted") {
    return "restricted" as const;
  }
  if (input.canonicalIntent.governanceRisk === "review" || input.registryEntry?.requiresApprovalDefault) {
    return "review" as const;
  }
  return "safe" as const;
}
