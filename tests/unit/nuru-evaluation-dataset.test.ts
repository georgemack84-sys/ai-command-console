import { describe, expect, it } from "vitest";
import { nuruEvaluationCases } from "@/tests/evals/nuru/cases";

describe("Nuru evaluation corpus", () => {
  it("covers the required curation failure modes and high-quality baseline", () => {
    expect(nuruEvaluationCases.map((testCase) => testCase.id)).toEqual(expect.arrayContaining(["obvious-duplicate", "subtle-duplicate", "unrelated-document", "contradictory-decision", "superseded-architecture", "poor-provenance", "ambiguous-project", "cross-project-relationship", "outdated-information", "high-quality-canonical"]));
  });

  it("keeps expected outcomes structured for specialist-specific evaluators", () => {
    expect(nuruEvaluationCases.every((testCase) => Object.keys(testCase.expected).length > 0)).toBe(true);
  });
});
