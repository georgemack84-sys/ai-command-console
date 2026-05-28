export function resolveSemanticConflicts(input: {
  contradictions: string[];
  ambiguityReasons: string[];
  unsupported: boolean;
}) {
  const semanticConflicts = Array.from(new Set([
    ...input.contradictions,
    ...(input.unsupported ? ["UNSUPPORTED_SEMANTIC_COMBINATION"] : []),
    ...(input.ambiguityReasons.includes("SEMANTIC_SCOPE_CONFLICT") ? ["SEMANTIC_SCOPE_CONFLICT"] : []),
  ]));

  return {
    semanticConflicts,
    blocked: semanticConflicts.length > 0,
  };
}
