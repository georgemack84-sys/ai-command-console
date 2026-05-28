import type { IntentCategory } from "@/types/intentContracts";
import { classifyTaxonomyCategory, resolveActionAlias, resolveTargetAlias } from "./intentTaxonomy";

export function classifySemanticIntent(input: string) {
  const category = classifyTaxonomyCategory(input);
  const action = resolveActionAlias(input);
  const target = resolveTargetAlias(input);

  return {
    category,
    action,
    target,
    supportedCategory: category !== "unknown",
  };
}

export function inferOperationalCategory(input: string): IntentCategory {
  return classifyTaxonomyCategory(input);
}
