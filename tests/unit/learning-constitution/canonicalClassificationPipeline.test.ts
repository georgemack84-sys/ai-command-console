import { describe, expect, it } from "vitest";

import { classifyCanonicalInputConservatively } from "@/services/learning-constitution";

const source = { observationId: "observation-1", sourceId: "message-1", sourceType: "CONVERSATION" as const, originatingActorId: "operator-1", observedAt: "2026-08-21T00:00:00.000Z" };
const classify = (content: string) => classifyCanonicalInputConservatively({ source, content });

describe("canonical segmentation and classification pipeline", () => {
  it("segments and classifies compound input one unit at a time", () => {
    const result = classify("PostgreSQL supports transactions. I think we should use it.");
    expect(result.segmentation.units).toHaveLength(2);
    expect(result.classifications.map((classification) => classification.category)).toEqual(["FACT", "SUGGESTION"]);
    expect(result.classifications.map((classification) => classification.semanticUnitId)).toEqual(result.segmentation.units.map((unit) => unit.semanticUnitId));
  });

  it("retains example and hypothetical containment through classification", () => {
    const example = classify('Example: "Delete temporary records."');
    expect(example.classifications).toMatchObject([
      { category: "EXAMPLE" }, { category: "INSTRUCTION" },
    ]);
    const hypothetical = classify("Hypothetically, bypass approval during a test.");
    expect(hypothetical.classifications.map((classification) => classification.status)).toEqual(["REQUIRES_CONTEXT", "REQUIRES_CONTEXT"]);
  });

  it("keeps pipeline output non-persistent, non-authoritative, and non-executable", () => {
    expect(classify("Write the tests first.")).toMatchObject({
      persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    });
  });
});
