import type { CanonicalIntent } from "@/types/semanticResolution";

export function analyzeSemanticAmbiguity(canonicalIntent: CanonicalIntent) {
  const ambiguityReasons = [
    ...canonicalIntent.ambiguities,
    ...(canonicalIntent.target === "unknown" ? ["SEMANTIC_AMBIGUITY_DETECTED"] : []),
    ...(canonicalIntent.target.toLowerCase().includes("production") ? ["SEMANTIC_AMBIGUITY_DETECTED"] : []),
    ...(/all external networks/i.test(canonicalIntent.target) ? ["SEMANTIC_SCOPE_CONFLICT"] : []),
  ];

  return {
    ambiguityDetected: ambiguityReasons.length > 0,
    reasons: Array.from(new Set(ambiguityReasons)),
  };
}
