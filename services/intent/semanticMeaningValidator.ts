import type { ToolRegistryEntry } from "@/services/registry/toolRegistry";
import type { CanonicalIntent } from "@/types/semanticResolution";

export function validateSemanticMeaning(input: {
  canonicalIntent: CanonicalIntent;
  registryEntry: ToolRegistryEntry | null;
}) {
  const { canonicalIntent, registryEntry } = input;
  const violations: string[] = [];
  const warnings: string[] = [];

  if (!canonicalIntent.action || !canonicalIntent.target) {
    violations.push("SEMANTIC_MEANING_INVALID");
  }

  if (/^filesystem\./.test(canonicalIntent.action) && /^localhost$/i.test(canonicalIntent.target)) {
    violations.push("INTENT_CONTEXT_MISMATCH");
  }

  if (registryEntry && !registryEntry.capabilities.includes(canonicalIntent.action)) {
    violations.push("SEMANTIC_CAPABILITY_DRIFT");
  }

  if (canonicalIntent.clarificationRequired) {
    warnings.push("SEMANTIC_AMBIGUITY_DETECTED");
  }

  return {
    semanticValid: violations.length === 0,
    violations,
    warnings,
  };
}
