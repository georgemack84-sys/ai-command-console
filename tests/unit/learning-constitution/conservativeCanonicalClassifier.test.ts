import { describe, expect, it } from "vitest";

import { CANONICAL_GOLDEN_CORPUS, classifyCanonicalSemanticUnitConservatively } from "@/services/learning-constitution";
import type { SemanticUnit } from "@/types/learning-constitution";

const source = { observationId: "observation-1", sourceId: "corpus-case", sourceType: "DOCUMENT" as const, originatingActorId: "test", observedAt: "2026-08-20T00:00:00.000Z" };
const toUnit = (semanticUnitId: string, content: string, containment: SemanticUnit["containment"]): SemanticUnit => ({
  semanticUnitId, source, sourceOrder: 0, textSpan: { start: 0, end: content.length }, content, containment,
  ...(containment === "ROOT" ? {} : { parentSemanticUnitId: "parent" }),
});

describe("conservative canonical semantic-unit classifier", () => {
  it("matches the golden corpus only where explicit evidence supports an expected outcome", () => {
    for (const testCase of CANONICAL_GOLDEN_CORPUS.cases) {
      for (const expected of testCase.expectedUnits) {
        const classified = classifyCanonicalSemanticUnitConservatively(toUnit(expected.unitId, expected.content, expected.containment));
        expect(classified.status, testCase.caseId).toBe(expected.expectedStatus);
        expect(classified.category, testCase.caseId).toBe(expected.expectedCategory);
        expect(expected.prohibitedCategories, testCase.caseId).not.toContain(classified.category);
        if (expected.expectedCandidates) expect(classified.candidates.map((candidate) => candidate.category)).toEqual(expected.expectedCandidates);
      }
    }
  });

  it("returns review or context requirements instead of guessing", () => {
    const unknown = classifyCanonicalSemanticUnitConservatively(toUnit("unknown", "This seems fine.", "ROOT"));
    const hypothetical = classifyCanonicalSemanticUnitConservatively(toUnit("hypothetical", "bypass approval", "HYPOTHETICAL"));
    expect(unknown).toMatchObject({ status: "REQUIRES_REVIEW" });
    expect(unknown).not.toHaveProperty("category");
    expect(hypothetical).toMatchObject({ status: "REQUIRES_CONTEXT" });
    expect(hypothetical).not.toHaveProperty("category");
  });

  it("never persists information or grants authority or execution", () => {
    expect(classifyCanonicalSemanticUnitConservatively(toUnit("instruction", "Delete records.", "ROOT"))).toMatchObject({
      category: "INSTRUCTION", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    });
  });
});
