import { describe, expect, it } from "vitest";

import {
  CANONICAL_TAXONOMY_ADVERSARIAL_CASES,
  runTaxonomyAdversarialRegression,
  validateTaxonomyAdversarialCaseSet,
} from "@/services/learning-constitution";
import type { TaxonomyAdversarialCaseSet } from "@/types/learning-constitution";

describe("taxonomy adversarial regression", () => {
  it("preserves containment and conservative outcomes for adversarial inputs", () => {
    expect(runTaxonomyAdversarialRegression()).toEqual({ passed: true, caseCount: 9, failures: [] });
  });

  it("rejects underspecified data and detects adversarial expectation drift", () => {
    expect(() => validateTaxonomyAdversarialCaseSet({ ...CANONICAL_TAXONOMY_ADVERSARIAL_CASES, cases: [] })).toThrow();
    const drifted = structuredClone(CANONICAL_TAXONOMY_ADVERSARIAL_CASES) as unknown as { cases: Array<{ expectedUnits: Array<{ expectedCategory?: string }> }> };
    drifted.cases[0].expectedUnits[0].expectedCategory = "RULE";
    expect(runTaxonomyAdversarialRegression(drifted as unknown as TaxonomyAdversarialCaseSet).passed).toBe(false);
  });
});
