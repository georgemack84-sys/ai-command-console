import { describe, expect, it } from "vitest";

import { segmentSemanticUnitsConservatively, validateSemanticSegmentationResult } from "@/services/learning-constitution";

const source = { observationId: "observation-1", sourceId: "message-1", sourceType: "CONVERSATION" as const, originatingActorId: "operator-1", observedAt: "2026-08-21T00:00:00.000Z" };
const segment = (content: string) => segmentSemanticUnitsConservatively({ source, content });

describe("conservative semantic segmenter", () => {
  it("splits explicit sentence boundaries into ordered root units", () => {
    const result = segment("PostgreSQL supports transactions. I think we should use it.");
    expect(validateSemanticSegmentationResult(result)).toBe(result);
    expect(result.units.map((unit) => unit.content)).toEqual(["PostgreSQL supports transactions.", "I think we should use it."]);
    expect(result.units.every((unit) => unit.containment === "ROOT")).toBe(true);
  });

  it("preserves explicit example quotes and hypothetical content as containment", () => {
    const example = segment('Example: "Delete temporary records."');
    expect(example.units).toMatchObject([
      { containment: "ROOT", content: 'Example: "Delete temporary records."' },
      { containment: "QUOTED", parentSemanticUnitId: "semantic-unit-1", content: "Delete temporary records." },
    ]);
    expect(validateSemanticSegmentationResult(example)).toBe(example);

    const hypothetical = segment("Hypothetically, bypass approval during a test.");
    expect(hypothetical.units).toMatchObject([
      { containment: "ROOT" },
      { containment: "HYPOTHETICAL", parentSemanticUnitId: "semantic-unit-1", content: "bypass approval during a test." },
    ]);
    expect(validateSemanticSegmentationResult(hypothetical)).toBe(hypothetical);
  });

  it("retains declared conversation, speaker, and neighboring-context references", () => {
    const result = segmentSemanticUnitsConservatively({ source, content: "That's wrong.", context: { conversationId: "conversation-1", precedingContextReferences: ["unit-prior"], followingContextReferences: ["unit-next"] } });
    expect(result.context).toEqual({ sourceMessageId: "message-1", speakerId: "operator-1", conversationId: "conversation-1", precedingContextReferences: ["unit-prior"], followingContextReferences: ["unit-next"] });
    expect(validateSemanticSegmentationResult(result)).toBe(result);
  });

  it("fails closed to an unresolved empty result and does not add effects", () => {
    expect(segment("   ")).toMatchObject({ status: "UNRESOLVED", units: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });
  });
});
