import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";

export function analyzeSemanticContext(input: {
  structuredIntent: StructuredIntent;
  canonicalIntent: CanonicalIntent;
}) {
  const text = `${input.structuredIntent.rawInput} ${input.structuredIntent.normalizedInput}`.toLowerCase();

  return {
    hasEnvironment: /\bproduction\b|\bstaging\b|\bdev\b|\bdevelopment\b|\bqa\b/.test(text),
    hasService: /\bservice\b|\bapp\b|\bapi\b|\bworker\b/.test(text),
    hasScope: /\blocalhost\b|\bsingle\b|\bcluster\b|\beverywhere\b|\ball\b/.test(text),
    hasRollbackPolicy: /\brollback\b/.test(text),
    hasForceMode: /\bforce\b|\bforced\b/.test(text),
    hasGracefulMode: /\bgraceful\b/.test(text),
    mentionsProduction: /\bproduction\b/.test(text),
    mentionsLatest: /\blatest\b/.test(text),
    mentionsGlobal: /\beverywhere\b|\ball nodes\b|\ball external networks\b/.test(text),
    mentionsTenant: /\btenant\b/.test(text),
  };
}
