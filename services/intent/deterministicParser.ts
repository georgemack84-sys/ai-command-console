import type { ParserCandidate } from "@/types/intentContracts";
import { PATH_PATTERN, PORT_PATTERN, DANGEROUS_PATTERNS } from "./semanticPatterns";
import { classifySemanticIntent } from "./semanticClassifier";
import { detectIntentAmbiguities } from "./ambiguityDetector";

function extractParameters(input: string) {
  const parameters: Record<string, unknown> = {};
  const pathMatch = input.match(PATH_PATTERN);
  const portMatch = input.match(PORT_PATTERN);

  if (pathMatch?.[0]) {
    parameters.path = pathMatch[0];
  }
  if (portMatch?.[1]) {
    parameters.port = Number(portMatch[1]);
  }

  return parameters;
}

export function parseIntentDeterministically(normalizedInput: string): ParserCandidate {
  const classified = classifySemanticIntent(normalizedInput);
  const ambiguities = detectIntentAmbiguities({
    normalizedInput,
    action: classified.action,
    target: classified.target,
  });
  const dangerous = DANGEROUS_PATTERNS.some((pattern) => pattern.test(normalizedInput));

  return {
    operationalIntent: normalizedInput,
    category: classified.category,
    intent: {
      action: classified.action === "unknown" ? "clarify" : classified.action,
      target: classified.target === "unknown" ? "unknown" : classified.target,
      parameters: extractParameters(normalizedInput),
    },
    confidence:
      classified.action !== "unknown" && classified.target !== "unknown" && ambiguities.length === 0 && !dangerous
        ? 0.96
        : 0.58,
    source: "deterministic",
    ambiguities,
    clarificationRequired: ambiguities.length > 0 || classified.action === "unknown" || classified.target === "unknown",
    warnings: dangerous ? ["dangerous_semantic_pattern_detected"] : [],
    supported: classified.supportedCategory && classified.action !== "unknown",
    dangerous,
    semanticWarnings: dangerous ? ["dangerous_semantic_pattern_detected"] : [],
  };
}
