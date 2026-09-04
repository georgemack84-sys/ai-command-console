import { describe, expect, it } from "vitest";

import { validateSemanticSegmentationResult } from "@/services/learning-constitution";
import type { SemanticSegmentationResult, SemanticUnit } from "@/types/learning-constitution";

const source = {
  observationId: "observation-1", sourceId: "message-1", sourceType: "CONVERSATION" as const,
  originatingActorId: "operator-1", observedAt: "2026-08-20T00:00:00.000Z",
};
const sourceContent = "PostgreSQL supports transactions. I think we should use it.";
const unit = (semanticUnitId: string, sourceOrder: number, content: string): SemanticUnit => {
  const start = sourceContent.indexOf(content);
  return { semanticUnitId, source, sourceOrder, textSpan: { start, end: start + content.length }, content, containment: "ROOT" };
};
const validResult = (): SemanticSegmentationResult => ({
  source, sourceContent, status: "SEGMENTED", reasonCodes: ["COMPOUND_INPUT"],
  context: { sourceMessageId: "message-1", speakerId: "operator-1", precedingContextReferences: [], followingContextReferences: [] },
  units: [unit("unit-fact", 0, "PostgreSQL supports transactions."), unit("unit-suggestion", 1, "I think we should use it.")],
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

describe("semantic unit contract", () => {
  it("accepts ordered compound units without assigning meaning or effects", () => {
    const result = validResult();
    expect(validateSemanticSegmentationResult(result)).toBe(result);
  });

  it("preserves quoted and example content as bounded containment", () => {
    const content = 'Example: "Delete temporary records."';
    const quoted = "Delete temporary records.";
    const example: SemanticUnit = {
      semanticUnitId: "example", source, sourceOrder: 0, textSpan: { start: 0, end: content.length },
      content, containment: "ROOT",
    };
    const quotedUnit: SemanticUnit = {
      semanticUnitId: "quoted", source, sourceOrder: 1,
      textSpan: { start: content.indexOf(quoted), end: content.indexOf(quoted) + quoted.length },
      content: quoted, containment: "QUOTED", parentSemanticUnitId: "example",
    };
    expect(validateSemanticSegmentationResult({
      ...validResult(), sourceContent: content, units: [example, quotedUnit], reasonCodes: ["QUOTED_EXAMPLE"],
    }).units.map((entry) => entry.containment)).toEqual(["ROOT", "QUOTED"]);
  });

  it("fails closed for mismatched spans, invalid containment, and containment cycles", () => {
    const mismatched = validResult();
    expect(() => validateSemanticSegmentationResult({ ...mismatched, units: [{ ...mismatched.units[0], content: "wrong" }, ...mismatched.units.slice(1)] })).toThrow();
    const orphan = validResult();
    expect(() => validateSemanticSegmentationResult({ ...orphan, units: [{ ...orphan.units[0], containment: "QUOTED", parentSemanticUnitId: "missing" }, ...orphan.units.slice(1)] })).toThrow();
    const cyclic = validResult();
    expect(() => validateSemanticSegmentationResult({ ...cyclic, units: [
      { ...cyclic.units[0], containment: "QUOTED", parentSemanticUnitId: "unit-suggestion" },
      { ...cyclic.units[1], containment: "EXAMPLE", parentSemanticUnitId: "unit-fact" },
    ] })).toThrow();
    const unrelatedSource = validResult();
    expect(() => validateSemanticSegmentationResult({ ...unrelatedSource, units: [
      { ...unrelatedSource.units[0], source: { ...source, sourceId: "message-2" } },
      unrelatedSource.units[1],
    ] })).toThrow();
  });

  it("allows an unresolved result only when no semantic units were emitted", () => {
    expect(() => validateSemanticSegmentationResult({ ...validResult(), status: "UNRESOLVED", units: [] })).not.toThrow();
    expect(() => validateSemanticSegmentationResult({ ...validResult(), status: "UNRESOLVED" })).toThrow();
  });
});
