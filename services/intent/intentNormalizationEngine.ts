import type { CanonicalIntent } from "@/types/semanticResolution";
import { NORMALIZED_ACTION_ALIASES } from "./intentResolutionPolicies";

export function normalizeOperationalIntent(canonicalIntent: CanonicalIntent) {
  const normalizedAction = NORMALIZED_ACTION_ALIASES[canonicalIntent.semanticMeaning.toLowerCase()] ?? canonicalIntent.action;

  return {
    action: normalizedAction,
    target: canonicalIntent.target,
    parameters: JSON.parse(JSON.stringify(canonicalIntent.parameters)) as Record<string, unknown>,
  };
}
