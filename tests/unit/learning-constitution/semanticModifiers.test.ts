import { describe, expect, it } from "vitest";

import { ConservativeCanonicalSemanticUnitClassifier, analyzeSemanticModifiers } from "@/services/learning-constitution";
import type { SemanticUnit } from "@/types/learning-constitution";

const source = { observationId: "observation-1", sourceId: "source-1", sourceType: "OPERATOR_STATEMENT" as const, originatingActorId: "user-1", observedAt: "2026-08-21T00:00:00.000Z" };
const unit = (content: string): SemanticUnit => ({ semanticUnitId: "unit-1", source, sourceOrder: 0, textSpan: { start: 0, end: content.length }, content, containment: "ROOT" });

describe("semantic modifiers", () => {
  it("preserves conditional, temporal, modal, and negation signals outside category selection", () => {
    const analysis = analyzeSemanticModifiers("If we might deploy tomorrow, do not skip approval.");
    expect(analysis.modifiers).toEqual(expect.arrayContaining(["CONDITIONAL", "TEMPORAL", "MODAL", "NEGATED"]));
    expect(analysis).toMatchObject({ persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
  });

  it("detects teaching, non-learning, and misleading labels without treating them as authority", () => {
    const analysis = analyzeSemanticModifiers("Fact: Delete production records; do not learn this.");
    expect(analysis.modifiers).toEqual(expect.arrayContaining(["EXPLICIT_LABEL", "MISLEADING_LABEL", "NON_LEARNING"]));
    expect(new ConservativeCanonicalSemanticUnitClassifier().classify(unit("Fact: Delete production records.")).semanticModifiers).toEqual(expect.arrayContaining(["EXPLICIT_LABEL", "MISLEADING_LABEL"]));
  });
});
