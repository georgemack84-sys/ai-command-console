import { describe, expect, it } from "vitest";

import { CANONICAL_GOLDEN_CORPUS, validateGoldenCorpus } from "@/services/learning-constitution";
import { CANONICAL_INFORMATION_CATEGORIES } from "@/types/learning-constitution";

describe("canonical taxonomy golden corpus", () => {
  it("loads a complete, versioned evaluation corpus without classifier behavior", () => {
    expect(CANONICAL_GOLDEN_CORPUS.corpusVersion).toBe("1.0.0");
    expect(new Set(CANONICAL_GOLDEN_CORPUS.cases.map((testCase) => testCase.kind))).toEqual(new Set([
      "CLEAR", "NEGATIVE", "NEAR_NEIGHBOR", "AMBIGUOUS", "COMPOUND", "SEQUENCE", "ADVERSARIAL",
    ]));
    expect(new Set(CANONICAL_GOLDEN_CORPUS.cases.flatMap((testCase) => testCase.expectedUnits.map((unit) => unit.expectedCategory).filter(Boolean)))).toEqual(new Set(CANONICAL_INFORMATION_CATEGORIES));
  });

  it("contains critical containment and false-promotion regressions", () => {
    const cases = new Map(CANONICAL_GOLDEN_CORPUS.cases.map((testCase) => [testCase.caseId, testCase]));
    expect(cases.get("adversarial-quoted-instruction")?.expectedUnits).toMatchObject([
      { containment: "ROOT", expectedCategory: "EXAMPLE", prohibitedCategories: ["INSTRUCTION", "RULE"] },
      { containment: "QUOTED", parentUnitId: "u1", expectedCategory: "INSTRUCTION" },
    ]);
    expect(cases.get("ambiguous-unspecified-commitment")?.expectedUnits[0]).toMatchObject({
      expectedStatus: "AMBIGUOUS", expectedCandidates: ["SUGGESTION", "DECISION"],
    });
  });

  it("rejects unknown categories, missing coverage, and invalid containment", () => {
    const unknown = structuredClone(CANONICAL_GOLDEN_CORPUS) as unknown as { cases: Array<{ expectedUnits: Array<Record<string, unknown>> }> };
    unknown.cases[0].expectedUnits[0].expectedCategory = "LOCAL_ALIAS";
    expect(() => validateGoldenCorpus(unknown)).toThrow();
    const missingKind = { ...CANONICAL_GOLDEN_CORPUS, cases: CANONICAL_GOLDEN_CORPUS.cases.filter((testCase) => testCase.kind !== "ADVERSARIAL") };
    expect(() => validateGoldenCorpus(missingKind)).toThrow();
    const invalidParent = structuredClone(CANONICAL_GOLDEN_CORPUS) as unknown as { cases: Array<{ expectedUnits: Array<Record<string, unknown>> }> };
    invalidParent.cases.at(-1)!.expectedUnits[1].parentUnitId = "missing";
    expect(() => validateGoldenCorpus(invalidParent)).toThrow();
  });
});
