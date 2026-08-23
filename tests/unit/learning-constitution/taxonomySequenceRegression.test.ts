import { describe, expect, it } from "vitest";

import {
  CANONICAL_TAXONOMY_SEQUENCE_CASES,
  runTaxonomySequenceRegression,
  validateTaxonomySequenceCaseSet,
} from "@/services/learning-constitution";
import type { TaxonomySequenceCaseSet } from "@/types/learning-constitution";

describe("taxonomy sequence regression", () => {
  it("preserves each turn's semantic classification across ordered conversations", () => {
    expect(runTaxonomySequenceRegression()).toEqual({ passed: true, sequenceCount: 5, failures: [] });
  });

  it("rejects malformed sequences and detects expected-result drift", () => {
    expect(() => validateTaxonomySequenceCaseSet({ ...CANONICAL_TAXONOMY_SEQUENCE_CASES, cases: [] })).toThrow();
    const drifted = structuredClone(CANONICAL_TAXONOMY_SEQUENCE_CASES) as unknown as { cases: Array<{ turns: Array<{ expectedCategory?: string }> }> };
    drifted.cases[0].turns[0].expectedCategory = "DECISION";
    expect(runTaxonomySequenceRegression(drifted as unknown as TaxonomySequenceCaseSet).passed).toBe(false);
  });
});
