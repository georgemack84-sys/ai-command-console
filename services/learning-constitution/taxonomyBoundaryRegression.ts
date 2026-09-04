import boundaryCases from "../../learning/taxonomy/boundary-cases.v1.json";
import type { TaxonomyBoundaryCaseSet, TaxonomyBoundaryRegressionReport } from "../../types/learning-constitution";
import { classifyCanonicalInputConservatively } from "./canonicalClassificationPipeline";
import { CANONICAL_TAXONOMY_REGISTRY } from "./canonicalTaxonomyRegistry";

export const validateTaxonomyBoundaryCaseSet = (value: unknown): TaxonomyBoundaryCaseSet => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("taxonomy boundary case set is invalid");
  const candidate = value as Record<string, unknown>;
  if (candidate.taxonomyVersion !== "1.0.0" || !Array.isArray(candidate.cases)) throw new Error("taxonomy boundary case set root is invalid");
  const registryPairs = new Set(CANONICAL_TAXONOMY_REGISTRY.boundaryRules.map((rule) => `${rule.leftCategory}:${rule.rightCategory}`));
  const caseIds = new Set<string>();
  for (const boundaryCase of candidate.cases) {
    if (typeof boundaryCase !== "object" || boundaryCase === null || Array.isArray(boundaryCase)) throw new Error("taxonomy boundary case is invalid");
    const item = boundaryCase as Record<string, unknown>;
    if (!["caseId", "leftCategory", "rightCategory", "input", "expectedCategory", "prohibitedCategory"].every((key) => typeof item[key] === "string") ||
      caseIds.has(item.caseId as string) || !registryPairs.has(`${item.leftCategory}:${item.rightCategory}`) ||
      item.expectedCategory !== item.leftCategory || item.prohibitedCategory !== item.rightCategory) {
      throw new Error("taxonomy boundary case does not match the registry boundary contract");
    }
    caseIds.add(item.caseId as string);
  }
  if (caseIds.size !== registryPairs.size) throw new Error("taxonomy boundary case set is incomplete");
  return candidate as TaxonomyBoundaryCaseSet;
};

export const CANONICAL_TAXONOMY_BOUNDARY_CASES = validateTaxonomyBoundaryCaseSet(boundaryCases);

export const runTaxonomyBoundaryRegression = (
  cases: TaxonomyBoundaryCaseSet = CANONICAL_TAXONOMY_BOUNDARY_CASES,
): TaxonomyBoundaryRegressionReport => {
  const failures: Array<{ caseId: string; detail: string }> = [];
  for (const boundaryCase of cases.cases) {
    const result = classifyCanonicalInputConservatively({
      source: { observationId: "boundary-regression", sourceId: boundaryCase.caseId, sourceType: "DOCUMENT", originatingActorId: "taxonomy-regression", observedAt: "2026-08-21T00:00:00.000Z" },
      content: boundaryCase.input,
    });
    const category = result.classifications[0]?.category;
    if (result.classifications.length !== 1 || category !== boundaryCase.expectedCategory || category === boundaryCase.prohibitedCategory) {
      failures.push({ caseId: boundaryCase.caseId, detail: "pipeline classification does not preserve the required category boundary" });
    }
  }
  return { passed: failures.length === 0, caseCount: cases.cases.length, failures };
};
