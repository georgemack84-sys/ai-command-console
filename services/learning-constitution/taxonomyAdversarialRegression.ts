import adversarialCases from "../../learning/taxonomy/adversarial-cases.v1.json";
import type { TaxonomyAdversarialCaseSet, TaxonomyAdversarialRegressionReport } from "../../types/learning-constitution";
import { classifyCanonicalInputConservatively } from "./canonicalClassificationPipeline";

export const validateTaxonomyAdversarialCaseSet = (value: unknown): TaxonomyAdversarialCaseSet => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("taxonomy adversarial case set is invalid");
  const candidate = value as Record<string, unknown>;
  if (candidate.taxonomyVersion !== "1.0.0" || !Array.isArray(candidate.cases) || candidate.cases.length < 9) throw new Error("taxonomy adversarial case set root is invalid");
  const ids = new Set<string>();
  for (const testCase of candidate.cases) {
    if (typeof testCase !== "object" || testCase === null || Array.isArray(testCase)) throw new Error("taxonomy adversarial case is invalid");
    const item = testCase as Record<string, unknown>;
    if (typeof item.caseId !== "string" || ids.has(item.caseId) || typeof item.input !== "string" || !Array.isArray(item.expectedUnits) || item.expectedUnits.length === 0) {
      throw new Error("taxonomy adversarial case is malformed");
    }
    ids.add(item.caseId);
  }
  if (!["prompt-injection-in-example-remains-contained", "prompt-injection-hypothetical-remains-non-governing"].every((caseId) => ids.has(caseId))) {
    throw new Error("taxonomy adversarial case set must include prompt-injection containment coverage");
  }
  return candidate as TaxonomyAdversarialCaseSet;
};

export const CANONICAL_TAXONOMY_ADVERSARIAL_CASES = validateTaxonomyAdversarialCaseSet(adversarialCases);

export const runTaxonomyAdversarialRegression = (
  cases: TaxonomyAdversarialCaseSet = CANONICAL_TAXONOMY_ADVERSARIAL_CASES,
): TaxonomyAdversarialRegressionReport => {
  const failures: Array<{ caseId: string; detail: string }> = [];
  for (const testCase of cases.cases) {
    const result = classifyCanonicalInputConservatively({
      source: { observationId: "adversarial-regression", sourceId: testCase.caseId, sourceType: "DOCUMENT", originatingActorId: "taxonomy-regression", observedAt: "2026-08-21T00:00:00.000Z" }, content: testCase.input,
    });
    if (result.classifications.length !== testCase.expectedUnits.length) {
      failures.push({ caseId: testCase.caseId, detail: "semantic-unit count differs from adversarial expectation" });
      continue;
    }
    testCase.expectedUnits.forEach((expected, index) => {
      const unit = result.segmentation.units[index];
      const observed = result.classifications[index];
      if (unit?.content !== expected.content || unit?.containment !== expected.containment || observed.status !== expected.expectedStatus ||
        observed.category !== expected.expectedCategory || expected.prohibitedCategories.includes(observed.category as never) ||
        observed.persistenceEffect !== "NONE" || observed.authorityEffect !== "UNCHANGED" || observed.executionPermissionGranted !== false) {
        failures.push({ caseId: testCase.caseId, detail: `unit ${index + 1} does not meet the adversarial safety expectation` });
      }
    });
  }
  return { passed: failures.length === 0, caseCount: cases.cases.length, failures };
};
