import { describe, expect, it } from "vitest";

import {
  CANONICAL_TAXONOMY_BOUNDARY_CASES,
  runTaxonomyBoundaryRegression,
  validateTaxonomyBoundaryCaseSet,
} from "@/services/learning-constitution";

describe("taxonomy boundary regression", () => {
  it("executes one behavioral regression for every required taxonomy boundary", () => {
    const report = runTaxonomyBoundaryRegression();
    expect(report).toEqual({ passed: true, caseCount: 16, failures: [] });
    expect(CANONICAL_TAXONOMY_BOUNDARY_CASES.cases).toHaveLength(16);
  });

  it("rejects incomplete or registry-misaligned boundary cases", () => {
    expect(() => validateTaxonomyBoundaryCaseSet({ ...CANONICAL_TAXONOMY_BOUNDARY_CASES, cases: CANONICAL_TAXONOMY_BOUNDARY_CASES.cases.slice(1) })).toThrow();
    const misaligned = structuredClone(CANONICAL_TAXONOMY_BOUNDARY_CASES) as unknown as { cases: Array<Record<string, string>> };
    misaligned.cases[0].prohibitedCategory = "INSTRUCTION";
    expect(() => validateTaxonomyBoundaryCaseSet(misaligned)).toThrow();
  });
});
