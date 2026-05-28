import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { analyzeSemanticContext } from "./semanticContextAnalyzer";
import { CONTEXT_REQUIREMENTS } from "./intentResolutionPolicies";

export function resolveIntentContextRequirements(input: {
  structuredIntent: StructuredIntent;
  canonicalIntent: CanonicalIntent;
}) {
  const context = analyzeSemanticContext(input);
  const required = CONTEXT_REQUIREMENTS[input.canonicalIntent.action] ?? [];

  const missingContext = required.filter((field) => {
    switch (field) {
      case "service":
        return !context.hasService;
      case "environment":
        return !context.hasEnvironment;
      case "scope":
        return !context.hasScope;
      case "rollbackPolicy":
        return !context.hasRollbackPolicy;
      case "mode":
        return !context.hasForceMode && !context.hasGracefulMode;
      case "deploymentTarget":
        return input.canonicalIntent.target === "unknown";
      default:
        return false;
    }
  });

  return {
    contextSufficient: missingContext.length === 0,
    missingContext,
  };
}
