import { AMBIGUOUS_PATTERNS, PATH_PATTERN } from "./semanticPatterns";

export function detectIntentAmbiguities(input: {
  normalizedInput: string;
  action: string;
  target: string;
}) {
  const ambiguities: string[] = [];

  if (input.action === "unknown") {
    ambiguities.push("action_unresolved");
  }
  if (input.target === "unknown" && !PATH_PATTERN.test(input.normalizedInput)) {
    ambiguities.push("target_unresolved");
  }
  if (AMBIGUOUS_PATTERNS.some((pattern) => pattern.test(input.normalizedInput))) {
    ambiguities.push("ambiguous_references_detected");
  }
  if (/\b(all|everything|anything)\b/i.test(input.normalizedInput) && input.target === "unknown") {
    ambiguities.push("dangerous_scope_ambiguity");
  }

  return ambiguities;
}
