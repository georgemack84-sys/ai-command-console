import type { StructuredIntent } from "@/types/intentContracts";
import type { CanonicalIntent } from "@/types/semanticResolution";
import { UNSAFE_ASSUMPTION_PATTERNS } from "./intentResolutionPolicies";

export function detectUnsafeAssumptions(input: {
  structuredIntent: StructuredIntent;
  canonicalIntent: CanonicalIntent;
}) {
  const text = `${input.structuredIntent.rawInput} ${input.structuredIntent.normalizedInput} ${input.canonicalIntent.target}`.toLowerCase();
  const unsafeAssumptions = UNSAFE_ASSUMPTION_PATTERNS
    .filter((entry) => entry.pattern.test(text))
    .map((entry) => entry.code);

  return {
    unsafeAssumptions: Array.from(new Set(unsafeAssumptions)),
  };
}
