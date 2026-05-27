import type { CanonicalIntent } from "@/types/semanticResolution";

export function detectIntentContradictions(canonicalIntent: CanonicalIntent) {
  const conflicts: string[] = [];
  const meaning = canonicalIntent.semanticMeaning.toLowerCase();
  const target = canonicalIntent.target.toLowerCase();
  const parameters = canonicalIntent.parameters;

  if (/\bdelete\b/.test(meaning) && /\bsafe(?:ly)?\b/.test(meaning) && /\bpermanent(?:ly)?\b/.test(meaning)) {
    conflicts.push("SEMANTIC_CONFLICT_DETECTED");
  }

  if (target.includes("localhost") && /external/.test(target)) {
    conflicts.push("SEMANTIC_SCOPE_CONFLICT");
  }

  if (parameters.recursive === true && Number(parameters.depth ?? 1) === 0) {
    conflicts.push("SEMANTIC_CONFLICT_DETECTED");
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}
