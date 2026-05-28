import type { ParserCandidate } from "@/types/intentContracts";

export function parseIntentFallback(normalizedInput: string): ParserCandidate {
  return {
    operationalIntent: normalizedInput,
    category: "unknown",
    intent: {
      action: "clarify",
      target: "unknown",
      parameters: {},
    },
    confidence: 0.2,
    source: "fallback",
    ambiguities: ["fallback_required"],
    clarificationRequired: true,
    warnings: ["unsupported_or_ambiguous_intent"],
    supported: false,
    dangerous: false,
    semanticWarnings: ["fallback_required"],
  };
}
