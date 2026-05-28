import type { IntentCategory } from "@/types/intentContracts";
import { ACTION_ALIASES, TARGET_ALIASES } from "./semanticPatterns";
import { INTENT_TAXONOMY_VERSION } from "./normalizationPolicies";

export const INTENT_ALLOWED_ACTIONS: Record<IntentCategory, string[]> = {
  system: ["inspect", "list", "validate"],
  network: ["inspect", "list", "validate", "search"],
  filesystem: ["inspect", "list", "read", "search", "validate"],
  runtime: ["inspect", "list", "validate", "recover"],
  diagnostics: ["inspect", "list", "validate", "search"],
  governance: ["inspect", "validate", "freeze"],
  recovery: ["inspect", "recover", "validate"],
  security: ["inspect", "validate", "search"],
  unknown: [],
};

export function resolveActionAlias(input: string) {
  const lower = input.toLowerCase();
  for (const [action, aliases] of Object.entries(ACTION_ALIASES)) {
    if (aliases.some((alias) => lower.includes(alias))) {
      return action;
    }
  }
  return "unknown";
}

export function resolveTargetAlias(input: string) {
  const lower = input.toLowerCase();
  for (const [target, aliases] of Object.entries(TARGET_ALIASES)) {
    if (aliases.some((alias) => lower.includes(alias))) {
      return target;
    }
  }
  return "unknown";
}

export function classifyTaxonomyCategory(input: string): IntentCategory {
  const target = resolveTargetAlias(input);
  switch (target) {
    case "filesystem":
    case "network":
    case "runtime":
    case "diagnostics":
    case "governance":
    case "recovery":
    case "security":
    case "system":
      return target;
    default:
      return "unknown";
  }
}

export function validateTaxonomy(action: string, category: IntentCategory) {
  return INTENT_ALLOWED_ACTIONS[category].includes(action);
}

export { INTENT_TAXONOMY_VERSION };
