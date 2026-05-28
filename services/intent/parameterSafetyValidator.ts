import type { CanonicalIntent } from "@/types/semanticResolution";
import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";

function containsWildcard(value: unknown) {
  return typeof value === "string" && /[*?]/.test(value);
}

function containsInjection(value: unknown) {
  return typeof value === "string" && /<script\b|javascript:|eval\(|powershell|bash -c|cmd \/c|rm -rf/i.test(value);
}

function depthOf(value: unknown, depth = 0): number {
  if (!value || typeof value !== "object") {
    return depth;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((max, item) => Math.max(max, depthOf(item, depth + 1)), depth + 1);
  }
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (max, item) => Math.max(max, depthOf(item, depth + 1)),
    depth + 1,
  );
}

export function validateIntentParameters(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
}) {
  const parameters = Object.values(input.canonicalIntent.parameters);
  const maxDepth = depthOf(input.canonicalIntent.parameters);
  const constraints = input.registryEntry?.parameterConstraints;

  const blockedReasons = [
    ...(parameters.some(containsInjection) ? ["UNSAFE_PARAMETERS"] : []),
    ...(constraints?.allowWildcards === false && parameters.some(containsWildcard) ? ["UNSAFE_PARAMETERS"] : []),
    ...(constraints?.maxDepth && maxDepth > constraints.maxDepth ? ["UNSAFE_PARAMETERS"] : []),
    ...(constraints?.allowRecursiveActions === false && /recursive|all files|everything/i.test(JSON.stringify(input.canonicalIntent.parameters)) ? ["UNSAFE_PARAMETERS"] : []),
  ];

  return {
    valid: blockedReasons.length === 0,
    blockedReasons,
  };
}
