import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";

export function detectContextualConflicts(input: {
  structuredIntent: StructuredIntent;
  canonicalIntent: CanonicalIntent;
}) {
  const text = input.structuredIntent.normalizedInput.toLowerCase();
  const conflictingContext = [
    ...(/localhost/.test(text) && /external/.test(text) ? ["SEMANTIC_SCOPE_CONFLICT"] : []),
    ...(/production/.test(text) && !/service|host|cluster|environment/.test(text) ? ["SEMANTIC_SCOPE_CONFLICT"] : []),
    ...(/graceful/.test(text) && /force/.test(text) ? ["INTENT_CONTEXT_MISMATCH"] : []),
    ...(input.canonicalIntent.parameters.recursive === true && Number(input.canonicalIntent.parameters.depth ?? 1) === 0
      ? ["SEMANTIC_CONFLICT_DETECTED"]
      : []),
  ];

  return {
    conflictingContext: Array.from(new Set(conflictingContext)),
  };
}
